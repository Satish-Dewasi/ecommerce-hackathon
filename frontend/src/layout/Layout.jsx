import Navbar from "../components/Navbar";
import MainContainer from "./MainContainer";

function Layout({ children }) {
  return (
    <MainContainer>
      <Navbar />
      {children}
    </MainContainer>
  );
}

export default Layout;
