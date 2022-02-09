import React from "react";

export function DeployERC721Token({ deployERC721Token }) {
  return (
    <div>
      <h4>Deploy ERC721 token (NFT)</h4>
      <form
        onSubmit={(event) => {
          // This function just calls the transferTokens callback with the
          // form's data.
          event.preventDefault();

          const formData = new FormData(event.target);
          const _name = formData.get("name");
          const _symbol = formData.get("symbol");
          const _baseURI = formData.get("baseURI");

          if (_name && _symbol && _baseURI) {
            deployERC721Token(_name, _symbol, _baseURI);
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
          <label>Base URI</label>
          <input className="form-control" type="text" name="baseURI" placeholder="https://helloworld.com/nft/item/" required />
          <small>Will be concatenated with token IDs to generate the token URIs</small>
        </div>
        <div className="form-group">
          <input className="btn btn-primary" type="submit" value="Deploy" />
        </div>
      </form>
    </div>
  );
}
