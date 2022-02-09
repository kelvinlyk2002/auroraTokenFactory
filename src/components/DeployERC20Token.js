import React from "react";

export function DeployERC20Token({ deployERC20Token }) {
  return (
    <div>
      <h4>Deploy ERC20 token</h4>
      <form
        onSubmit={(event) => {
          // This function just calls the transferTokens callback with the
          // form's data.
          event.preventDefault();

          const formData = new FormData(event.target);
          const _name = formData.get("name");
          const _symbol = formData.get("symbol");
          const _premint = formData.get("premint");
          const _decimals = formData.get("decimals");

          if (_name && _symbol && _premint && _decimals) {
            deployERC20Token(_name, _symbol, _premint, _decimals);
          }
        }}
      >
        <div className="form-group">
          <label>Name of token</label>
          <input className="form-control" type="text" name="name" required />
        </div>
        <div className="form-group">
          <label>Symbol</label>
          <input className="form-control" type="text" name="symbol" required />
        </div>
        <div className="form-group">
          <label>Premint token (without decimals)</label>
          <input
            className="form-control"
            type="number"
            step="1"
            name="premint"
            placeholder="21000000"
            required
          />
        </div>
        <div className="form-group">
          <label>Decimals</label>
          <input
            className="form-control"
            type="number"
            step="1"
            name="decimals"
            placeholder="18"
            required
          />
        </div>
        <div className="form-group">
          <input className="btn btn-primary" type="submit" value="Deploy" />
        </div>
      </form>
    </div>
  );
}
