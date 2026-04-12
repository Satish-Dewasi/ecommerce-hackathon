import User from "../models/userModel.js";
import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";

export const SHIPPING_COSTS = { standard: 99, express: 199, next_day: 299 };

export const buildAndPlaceOrder = async ({
  customerId,
  addressId,
  shippingMethod = "standard",
  paymentData,
  session,
}) => {
  const shippingCost = SHIPPING_COSTS[shippingMethod] ?? 99;
  const customer = await User.findById(customerId).session(session);

  const address = customer.addresses.id(addressId);
  if (!address)
    throw {
      status: 404,
      message: "Address not found. Please add a valid saved address.",
    };

  const shippingAddress = {
    fullName: address.fullName || customer.name,
    phone: address.phone || customer.phone,
    street: address.line1 + (address.line2 ? `, ${address.line2}` : ""),
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    country: address.country,
  };

  if (!customer.cart || customer.cart.length === 0)
    throw { status: 400, message: "Your cart is empty" };

  const cartToCheckout = customer.cart;
  const productIds = [...new Set(cartToCheckout.map((i) => i.product))];

  const products = await Product.find({
    _id: { $in: productIds },
    isDeleted: { $ne: true },
  }).session(session);

  const productMap = Object.fromEntries(
    products.map((p) => [p._id.toString(), p]),
  );
  const sellerBuckets = {};

  for (const cartItem of cartToCheckout) {
    const product = productMap[cartItem.product.toString()];
    if (!product)
      throw { status: 404, message: "Product not found for cart item" };

    const variant = product.variants.find((v) => v.sku === cartItem.variantSku);
    if (!variant)
      throw {
        status: 404,
        message: `Variant '${cartItem.variantSku}' not found in '${product.name}'`,
      };

    if (variant.stock < cartItem.quantity)
      throw {
        status: 400,
        message: `Insufficient stock for '${product.name}' (${variant.color} / ${variant.size}). Available: ${variant.stock}, Requested: ${cartItem.quantity}`,
      };

    const sellerId = product.seller.toString();
    const price = variant.price ?? product.salePrice ?? product.basePrice;
    const itemTotal = price * cartItem.quantity;

    if (!sellerBuckets[sellerId])
      sellerBuckets[sellerId] = {
        seller: product.seller,
        items: [],
        subTotal: 0,
      };

    sellerBuckets[sellerId].items.push({
      product: product._id,
      variantSnapshot: {
        sku: variant.sku,
        color: variant.color,
        size: variant.size,
        price,
      },
      quantity: cartItem.quantity,
      itemTotal,
    });
    sellerBuckets[sellerId].subTotal += itemTotal;
  }

  // Deduct stock atomically
  for (const cartItem of cartToCheckout) {
    await Product.updateOne(
      { _id: cartItem.product, "variants.sku": cartItem.variantSku },
      { $inc: { "variants.$.stock": -cartItem.quantity } },
      { session },
    );
  }

  const sellerOrders = Object.values(sellerBuckets).map((bucket) => ({
    seller: bucket.seller,
    items: bucket.items,
    subTotal: bucket.subTotal,
    status: "pending",
    statusHistory: [{ status: "pending", note: "Order placed" }],
  }));

  const itemsTotal = sellerOrders.reduce((sum, so) => sum + so.subTotal, 0);
  const grandTotal = itemsTotal + shippingCost;

  const [order] = await Order.create(
    [
      {
        customer: customerId,
        shippingAddress,
        sellerOrders,
        shippingMethod,
        shippingCost,
        grandTotal,
        payment: paymentData,
        overallStatus: "pending",
      },
    ],
    { session },
  );

  // Clear cart
  const checkedOutIds = new Set(cartToCheckout.map((i) => i._id.toString()));
  customer.cart = customer.cart.filter(
    (item) => !checkedOutIds.has(item._id.toString()),
  );
  await customer.save({ session, validateBeforeSave: false });

  return order;
};
