import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from "react-redux"
import { updateAccountData, disconnect } from "../features/blockchain"
import { ethers, utils } from "ethers"
import { Button, makeStyles, Box } from "@material-ui/core"
import { useNavigate } from "react-router-dom";
import Web3Modal from "web3modal"

import networks from "../networksMap.json"
import Identicon from "./Identicon";


const eth = window.ethereum
const web3Modal = new Web3Modal()

const useStyles = makeStyles((theme) => ({

    container: {
        padding: theme.spacing(3),
        display: "flex",
        float: "right",
        gap: theme.spacing(1)
    },
}));

function Account() {

    const classes = useStyles()
    let navigate = useNavigate();
    const dispatch = useDispatch()
    const data = useSelector((state) => state.blockchain.value)

    const [injectedProvider, setInjectedProvider] = useState();

    async function fetchAccountData() {
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)

        setInjectedProvider(provider);

        const signer = provider.getSigner()
        const chainId = await provider.getNetwork()
        const account = await signer.getAddress()
        const balance = await signer.getBalance()

        dispatch(updateAccountData(
            {
                account: account,
                balance: utils.formatUnits(balance),
                network: networks[String(chainId.chainId)]
            }
        ))
    }

    async function Disconnect() {
        web3Modal.clearCachedProvider();
        if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
            await injectedProvider.provider.disconnect();
            setInjectedProvider(null)
        }
        dispatch(disconnect())
        setTimeout(() => {
            navigate("/");
        }, 1);
    }

    useEffect(() => {
        if (eth) {
            eth.on('chainChanged', (chainId) => {
                fetchAccountData()
            })
            eth.on('accountsChanged', (accounts) => {
                fetchAccountData()
            })
        }
    }, [])

    const isConnected = data.account !== ""

    return (

        <div className={classes.container}>
            {isConnected ? (
                <>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={Disconnect}
                    >
                        <Box style={{ marginRight: '10px' }} color="#fff" sx={{
                            backgroundColor: 'primary.dark',
                            '&:hover': {
                                backgroundColor: 'primary.main',
                                opacity: [0.9, 0.8, 0.7],
                            },
                        }} >
                            {data.balance && parseFloat(data.balance).toFixed(4) + ""}
                        </Box>
                        {data.account &&
                            `${data.account.slice(0, 6)}...${data.account.slice(
                                data.account.length - 4,
                                data.account.length
                            )}`}
                        <Identicon />
                    </Button>
                </>
            ) : (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={fetchAccountData}
                >
                    Connect to Wallet
                </Button>
            )}
        </div>
    )
}

export default Account


