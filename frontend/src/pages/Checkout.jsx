import { useState } from "react";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";

const steps = ["INFORMATION", "SHIPPING", "PAYMENT"];

const Checkout = () => {
  const navigate = useNavigate();
  const { items, subtotal } = useCart();

  const [activeStep, setActiveStep] = useState(0);

  const [form, setForm] = useState({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    country: "",
    state: "",
    address: "",
    city: "",
    postalCode: "",
  });

  // ✅ removed TypeScript types
  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const shipping = 0;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-background text-foreground">

      <div className="px-4 md:px-8 py-6 md:py-10 max-w-6xl mx-auto">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="w-8 h-[1px] bg-foreground inline-block" />
        </button>

        <h1
          className="text-4xl md:text-5xl font-black uppercase mb-6"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          CHECKOUT
        </h1>

        {/* Steps */}
        <div className="flex gap-6 mb-8">
          {steps.map((step, i) => (
            <button
              key={step}
              onClick={() => setActiveStep(i)}
              className={`text-sm font-bold uppercase tracking-wider ${
                i === activeStep
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {step}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* FORM */}
          <div className="flex-1 max-w-lg">

            {/* Step 1 */}
            {activeStep === 0 && (
              <>
                <h2 className="text-sm font-black uppercase mb-4">
                  Contact Info
                </h2>

                <div className="space-y-3 mb-8">

                  <input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) =>
                      handleChange("email", e.target.value)
                    }
                    className="w-full border border-foreground/15 rounded-md px-4 py-3.5 text-sm bg-transparent"
                  />

                  <input
                    type="tel"
                    placeholder="Phone"
                    value={form.phone}
                    onChange={(e) =>
                      handleChange("phone", e.target.value)
                    }
                    className="w-full border border-foreground/15 rounded-md px-4 py-3.5 text-sm bg-transparent"
                  />

                </div>

                {/* Shipping address */}
                <h2 className="text-sm font-black uppercase mb-4">
                  Shipping Address
                </h2>

                <div className="space-y-3">

                  <div className="flex gap-3">

                    <input
                      placeholder="First Name"
                      value={form.firstName}
                      onChange={(e) =>
                        handleChange("firstName", e.target.value)
                      }
                      className="flex-1 border border-foreground/15 rounded-md px-4 py-3.5 text-sm bg-transparent"
                    />

                    <input
                      placeholder="Last Name"
                      value={form.lastName}
                      onChange={(e) =>
                        handleChange("lastName", e.target.value)
                      }
                      className="flex-1 border border-foreground/15 rounded-md px-4 py-3.5 text-sm bg-transparent"
                    />

                  </div>

                  {/* Country */}
                  <div className="relative">

                    <select
                      value={form.country}
                      onChange={(e) =>
                        handleChange("country", e.target.value)
                      }
                      className="w-full border border-foreground/15 rounded-md px-4 py-3.5 text-sm bg-transparent appearance-none"
                    >
                      <option value="">Country</option>
                      <option value="IN">India</option>
                      <option value="US">United States</option>
                    </select>

                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4" />

                  </div>

                  <input
                    placeholder="City"
                    value={form.city}
                    onChange={(e) =>
                      handleChange("city", e.target.value)
                    }
                    className="w-full border border-foreground/15 rounded-md px-4 py-3.5 text-sm bg-transparent"
                  />

                </div>

                <button
                  onClick={() => setActiveStep(1)}
                  className="bg-secondary px-6 py-4 mt-6 rounded-md font-bold"
                >
                  Shipping →
                </button>
              </>
            )}

            {/* Step 2 */}
            {activeStep === 1 && (
              <button
                onClick={() => setActiveStep(2)}
                className="bg-secondary px-6 py-4 mt-6 rounded-md font-bold"
              >
                Payment →
              </button>
            )}

            {/* Step 3 */}
            {activeStep === 2 && (
              <button className="bg-foreground text-background px-6 py-4 mt-6 rounded-md font-bold">
                Place Order →
              </button>
            )}

          </div>

          {/* ORDER SUMMARY */}
          <div className="lg:w-[360px]">

            <div className="border border-foreground/10 rounded-xl p-6">

              <h2 className="text-sm font-black uppercase mb-6">
                Your Order
              </h2>

              {items.map((item) => (

                <div key={item.id} className="flex justify-between">

                  <span>
                    {item.name} ({item.quantity})
                  </span>

                  <span>
                    ₹{item.price * item.quantity}
                  </span>

                </div>

              ))}

              <div className="border-t mt-4 pt-4 flex justify-between">

                <span>Total</span>

                <span>₹{total}</span>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Checkout;
