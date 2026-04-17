import Navbar from "./Navbar";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: "80vh",}}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}