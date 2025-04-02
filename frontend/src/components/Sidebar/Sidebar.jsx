import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="sidebar">
      <h2>Aksharavaani</h2>
      <nav>
        <Link
          to="/"
          className={`nav-button ${location.pathname === "/" ? "active" : ""}`}
        >
          Malayalam to Sign
        </Link>
        <Link
          to="/sign-to-malayalam"
          className={`nav-button ${
            location.pathname === "/sign-to-malayalam" ? "active" : ""
          }`}
        >
          Sign to Malayalam
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;

