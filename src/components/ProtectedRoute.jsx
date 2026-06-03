import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { subscribeToAuth } from "../firebase";

const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0c0c0d",
        color: "#f39c12",
        fontSize: "1.5rem",
        fontWeight: "bold",
        fontFamily: "sans-serif"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            border: "4px solid #151518",
            borderTop: "4px solid #f39c12",
            borderRadius: "50%",
            width: "50px",
            height: "50px",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px auto"
          }}></div>
          Carregando Sessão do Mestre Cervejeiro...
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
