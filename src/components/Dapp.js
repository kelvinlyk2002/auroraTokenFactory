import React from "react";
import { ethers } from "ethers";

// All the logic of this dapp is contained in the Dapp component.
// These other components are just presentational ones: they don't have any
// logic. They just render HTML.
import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { DeployERC20Token } from "./DeployERC20Token";
import { DeployERC721Token } from "./DeployERC721Token";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { WaitingForCompiling } from "./WaitingForCompiling";
import { DeploySuccess } from "./DeploySuccess";

const axios = require('axios').default;

const AURORA_TESTNET_ID = '1313161555';
const AURORA_MAINNET_ID = '1313161554';

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    this.initialState = {
      // The user's address and network
      selectedAddress: undefined,
      network: undefined,
      // The ID about transactions being sent
      txBeingSent: undefined,
      compiling: undefined,
      contractDeployed: undefined,
      // possible error with transactions
      transactionError: undefined,
      networkError: undefined,
    };

    this.state = this.initialState;
  }

  render() {
    // Ethereum wallets inject the window.ethereum object. If it hasn't been
    // injected, we instruct the user to install MetaMask.
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }

    // The next thing we need to do, is to ask the user to connect their wallet.
    // When the wallet gets connected, we are going to save the users's address
    // in the component's state. So, if it hasn't been saved yet, we have
    // to show the ConnectWallet component.
    //
    // Note that we pass it a callback that is going to be called when the user
    // clicks a button. This callback just calls the _connectWallet method.
    if (!this.state.selectedAddress) {
      return (
        <ConnectWallet 
          connectWallet={() => this._connectWallet()} 
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }

    // If everything is loaded, we render the application.
    return (
      <div className="container p-4">
        <div className="row">
          <div className="col-12">
            <h1>Aurora Token Factory</h1>
            <p>Welcome <b>{this.state.selectedAddress}</b>, you are on {this.state.network}.</p>
          </div>
        </div>

        <hr />

        <div className="row">
          <div className="col-12">
                        {/* 
              Present waiting for compiling message when compiling
            */}
          {this.state.compiling && (
              <WaitingForCompiling />
            )}

                                    {/* 
              Present waiting for compiling message when compiling
            */}
          {this.state.contractDeployed && (
              <DeploySuccess txHash={this.state.contractDeployed} />
            )}


            {/* 
              Sending a transaction isn't an immidiate action. You have to wait
              for it to be mined.
              If we are waiting for one, we show a message here.
            */}
            {this.state.txBeingSent && (
              <WaitingForTransactionMessage txHash={this.state.txBeingSent} />
            )}

            {/* 
              Sending a transaction can fail in multiple ways. 
              If that happened, we show a message here.
            */}
            {this.state.transactionError && (
              <TransactionErrorMessage
                message={this._getRpcErrorMessage(this.state.transactionError)}
                dismiss={() => this._dismissTransactionError()}
              />
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-lg-6">
            {(
              <DeployERC20Token
                deployERC20Token={(_name, _symbol, _premint, _decimals) =>
                  this._deployToken("ERC20",{name:_name, symbol:_symbol, premint:_premint, decimals:_decimals}, this._provider.getSigner(0))
                }
              />
            )}
          </div>
          <div className="col-lg-6">
            {(
              <DeployERC721Token
                deployERC721Token={(_name, _symbol, _baseURI) =>
                  this._deployToken("ERC721",{name:_name, symbol:_symbol, baseURI:_baseURI}, this._provider.getSigner(0))
                }
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  async _connectWallet() {
    // This method is run when the user clicks the Connect. It connects the
    // dapp to the user's wallet, and initializes it.

    // To connect to the user's wallet, we have to run this method.
    // It returns a promise that will resolve to the user's address.
    const [selectedAddress] = await window.ethereum.enable();

    // Once we have the address, we can initialize the application.

    // First we check the network
    if (!this._checkNetwork()) {
      return;
    }

    this._initialize(selectedAddress);

    // We reinitialize it whenever the user changes their account.
    window.ethereum.on("accountsChanged", ([newAddress]) => {
      // `accountsChanged` event can be triggered with an undefined newAddress.
      // This happens when the user removes the Dapp from the "Connected
      // list of sites allowed access to your addresses" (Metamask > Settings > Connections)
      // To avoid errors, we reset the dapp state 
      if (newAddress === undefined) {
        return this._resetState();
      }
      
      this._initialize(newAddress);
    });
    
    // We reset the dapp state if the network is changed
    window.ethereum.on("networkChanged", ([networkId]) => {
      this._resetState();
    });
  }

  _initialize(userAddress) {
    // This method initializes the dapp
    // We first store the user's address in the component's state
    this.setState({
      selectedAddress: userAddress,
    });
    // Then, we initialize ethers
    this._intializeEthers();
    // Determine the network the user is on
    if (window.ethereum.networkVersion === AURORA_TESTNET_ID) {
      this.setState({
        network: "Aurora Testnet"
      });
    } else if (window.ethereum.networkVersion === AURORA_MAINNET_ID){
      this.setState({
        network: "Aurora Mainnet"
      });
    }
  }

  async _intializeEthers() {
    // We first initialize ethers by creating a provider using window.ethereum
    this._provider = new ethers.providers.Web3Provider(window.ethereum);
  }

  async _deployToken(standard, object, signor) {
    try {
      // Clear preexisting messages
      this._dismissTransactionError();
      this.setState({txBeingSent: undefined});
      this.setState({contractDeployed: undefined});
      // Indiicate compiling
      this.setState({compiling: true});

      let url = "https://graffiti.casa/"+standard;

      axios.post(url, object)
      .then(async (response) => {
        let abi = response['data']['contracts']["token.sol"][object.name]['abi'];
        let bytecode = response['data']['contracts']["token.sol"][object.name]['evm']['bytecode']['object'];
        let factory = new ethers.ContractFactory(abi, bytecode, signor);
        let contract = await factory.deploy();
        // Inform user the contract is being mined
        this.setState({compiling: false});
        this.setState({ txBeingSent: contract.deployTransaction.hash });

        // We use .wait() to wait for the transaction to be mined. This method
        // returns the transaction's receipt.
        let receipt = await contract.deployTransaction.wait();
        this.setState({ contractDeployed: receipt.contractAddress});

        // The receipt, contains a status flag, which is 0 to indicate an error.
        if (receipt.status === 0) {
          // We can't know the exact error that made the transaction fail when it
          // was mined, so we throw this generic one.
          throw new Error("Transaction failed");
        }
      });

      // If we got here, the transaction was successful, so you may want to
      // update your state. Here, we update the user's balance.
    } catch (error) {
    //   // We check the error code to see if this error was produced because the
    //   // user rejected a tx. If that's the case, we do nothing.
      this.setState({compiling: false});
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }
    //   // Other errors are logged and stored in the Dapp's state. This is used to
    //   // show them to the user, and for debugging.
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
    //   // If we leave the try/catch, we aren't sending a tx anymore, so we clear
    //   // this part of the state.
      this.setState({ txBeingSent: undefined });
    }
  }

  // This method just clears part of the state.
  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  // This method just clears part of the state.
  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  // This is an utility method that turns an RPC error into a human readable
  // message.
  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message;
    }

    return error.message;
  }

  // This method resets the state
  _resetState() {
    this.setState(this.initialState);
  }

  // This method checks if Metamask selected network is Aurora Testnet 
  _checkNetwork() {
    if (window.ethereum.networkVersion === AURORA_TESTNET_ID || window.ethereum.networkVersion === AURORA_MAINNET_ID) {
      return true;
    }

    this.setState({ 
      networkError: 'Please connect Metamask to Aurora networks: https://doc.aurora.dev/getting-started/network-endpoints/'
    });

    return false;
  }
}
