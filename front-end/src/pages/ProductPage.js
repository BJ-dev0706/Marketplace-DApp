import React, { useState, useEffect } from 'react'
import 'bootstrap/dist/css/bootstrap.css';
import { Table } from "react-bootstrap"
import { ethers, utils } from "ethers"
import { useDispatch, useSelector } from "react-redux"
import { updateAccountData } from "../features/blockchain"
import { CircularProgress } from "@material-ui/core"
import { useParams } from 'react-router-dom'


import MarketContract from "../artifacts/contracts/MarketPlace.json"
import contractsAddress from "../artifacts/deployments/map.json"
import Main from "../components/Main"

const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
const Marketaddress = contractsAddress["5777"]["MarketPlace"][0]

const statusMap = { 1: "IN SALE", 2: "PENDING", 3: "SENT", 4: "SOLD" }

function ProductPage() {
    const { id } = useParams()
    const dispatch = useDispatch()
    const data = useSelector((state) => state.blockchain.value)

    const [productState, setProductState] = useState({
        seller: "",
        name: "",
        description: "",
        image: "",
        price: 0,
        price_eth: 0,
        buyer: "",
        status: "",
    })

    const [loading, setLoading] = useState(false)

    const updateBalance = async () => {
        const signer = provider.getSigner()
        const balance = await signer.getBalance()
        dispatch(
            updateAccountData(
                { ...data, balance: utils.formatUnits(balance) }
            )
        )
    }

    const productDetails = async (product) => {
        if (product !== undefined) {
            const market = new ethers.Contract(Marketaddress, MarketContract.abi, provider);
            const details = await market.getProductDetails(product)

            convertPrice(utils.formatUnits(details[5])).then(res => {
                setProductState({
                    ...productState,
                    seller: details[1],
                    name: details[2],
                    description: details[3],
                    image: details[4],
                    price: utils.formatUnits(details[5]),
                    price_eth: utils.formatUnits(res),
                    buyer: details[6],
                    status: statusMap[details[7]]
                })
            })
        }
    }

    const purchase = async (product) => {
        try {
            if (product !== undefined) {
                setLoading(true)
                const price_in_eth = productState.price_eth
                const signer = provider.getSigner()
                const market = new ethers.Contract(Marketaddress, MarketContract.abi, signer);

                const purchase_tx = await market.purchase(product, { value: utils.parseEther(price_in_eth, "ether") })
                await purchase_tx.wait()

                setLoading(false)
                productDetails(product)
                updateBalance()
            }
        }
        catch (err) {
            window.alert("An error has occured, Please try again")
            setLoading(false)
        }
    }

    const send = async (product) => {
        try {
            if (product !== undefined) {
                setLoading(true)
                const signer = provider.getSigner()
                const market = new ethers.Contract(Marketaddress, MarketContract.abi, signer);
                const send_tx = await market.sendProduct(product)
                await send_tx.wait()

                setLoading(false)
                productDetails(product)
                updateBalance()
            }
        }
        catch (err) {
            window.alert("An error has occured, Please try again")
            setLoading(false)
        }
    }
    const confirm = async (product) => {
        try {
            if (product !== undefined) {
                setLoading(true)
                const signer = provider.getSigner()
                const market = new ethers.Contract(Marketaddress, MarketContract.abi, signer);
                const confirm_tx = await market.confirmRecieved(product)
                await confirm_tx.wait()

                setLoading(false)
                productDetails(product)
                updateBalance()
            }
        }
        catch (err) {
            window.alert("An error has occured, Please try again")
            setLoading(false)
        }
    }

    const cancel = async (product) => {
        try {
            if (product !== undefined) {
                setLoading(true)
                const signer = provider.getSigner()
                const market = new ethers.Contract(Marketaddress, MarketContract.abi, signer);
                const cancel_tx = await market.cancelPurchase(product)
                await cancel_tx.wait()

                setLoading(false)
                productDetails(product)
                updateBalance()
            }
        }

        catch (err) {
            window.alert("An error has occured, Please try again")
            setLoading(false)
        }
    }

    async function convertPrice(amount) {
        console.log(amount)
        const market = new ethers.Contract(Marketaddress, MarketContract.abi, provider);
        const price_in_eth = await market.callStatic.convertUSDToETH(utils.parseEther(amount, "ether"))
        return price_in_eth;
    }

    useEffect(() => {
        productDetails(Number(id))
    }, [data.account, data.network])


    return (
        <>
            <Main />
            <div className='row p-2'>
                <div className='col-md-7 text-center p-3'>
                    <div className='p-3'>
                        <div>Sale of <b id='itemname'>{productState.name}</b> for <b id='itemprice'>{parseFloat(productState.price_eth).toFixed(4)} ETH</b></div>
                        <div>{productState.description}</div>
                        <br />
                        <img src={productState.image} height="350px" width="560px" />
                        <br />
                        <br />
                        {data.account === productState.seller ? (
                            productState.status === "IN SALE" ? (
                                <p>Your product is in sale</p>
                            ) : (
                                productState.status === "PENDING" ? (
                                    <button className="btn btn-info"
                                        onClick={() => { send(id) }}
                                        role="button">
                                        {loading ? <CircularProgress size={26} color="#fff" /> : "SEND"}
                                    </button>
                                ) : productState.status === "SENT" ? (
                                    <p>waiting for confirmation from buyer</p>
                                ) : (
                                    <p>Your product has been sold</p>
                                )
                            )

                        ) : (
                            productState.status === "IN SALE" ? (
                                <button className="btn btn-info" onClick={() => { purchase(id) }} role="button">
                                    {loading ? <CircularProgress size={26} color="#fff" /> : "Buy"}
                                </button>
                            ) : (
                                productState.status === "PENDING" ? (
                                    <>
                                        <p>waiting for seller to send product</p>
                                        <button className="btn btn-info" onClick={() => { cancel(id) }} role="button">
                                            {loading ? <CircularProgress size={26} color="#fff" /> : "Cancel"}
                                        </button>
                                    </>
                                ) : productState.status === "SENT" ? (
                                    <button className="btn btn-info" onClick={() => { confirm(id) }} role="button">
                                        {loading ? <CircularProgress size={26} color="#fff" /> : "Confirm"}
                                    </button>
                                ) : (
                                    <p>Your have purchased this product</p>
                                )

                            )
                        )}
                    </div>

                </div>
                <div className='col-md-5 p-3'>
                    <h3 className='text-center p-2'>Product Details</h3>
                    <Table responsive>
                        <tbody>
                            <tr>
                                <td className='p-2'>Seller</td>
                                <td>{data.account === productState.seller ? "you are the seller" : productState.seller}</td>
                            </tr>

                            <tr>
                                <td className='p-2'>Product Status</td>
                                <td>{productState.status}</td>
                            </tr>

                            <tr>
                                <td className='p-2'>Price in USD</td>
                                <td>{productState.price} $</td>
                            </tr>
                            <tr>
                                <td className='p-2'>Price in ETH</td>
                                <td>{parseFloat(productState.price_eth).toFixed(5)}</td>
                            </tr>
                            <tr>
                                <td className='p-2'>Buyer</td>
                                <td>
                                    {data.account === productState.buyer ?
                                        "You are the buyer" : productState.buyer === ethers.constants.AddressZero ?
                                            "No buyer yet" : productState.buyer
                                    }
                                </td>
                            </tr>
                        </tbody>

                    </Table >

                </div>

            </div>
        </>
    )
}

export default ProductPage