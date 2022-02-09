import React from "react";

export function DeploySuccess({ txHash }) {
  return (
    <div className="alert alert-success" role="alert">
      Contract <strong>{txHash}</strong> successfully deployed
    </div>
  );
}