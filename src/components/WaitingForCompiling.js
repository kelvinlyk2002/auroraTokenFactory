import React from "react";

export function WaitingForCompiling() {
  return (
    <div className="alert alert-warning" role="alert">
      Waiting for compilation, please wait for MetaMask to popup and sign.
    </div>
  );
}