import { React, useRef, useState, useEffect } from "react";
import styles from "./css/addOrder.module.scss";
import { useHistory } from "react-router-dom";
import supabase from "../supabase";

import DatePicker from "react-date-picker";
import qricon from "../assets/qricon.png";

import domtoimage from "dom-to-image";
import * as htmlToImage from "html-to-image";
import { toPng, toJpeg, toBlob, toPixelData, toSvg } from "html-to-image";
import download from "downloadjs";
import { saveAs } from "file-saver";

import {
  CloseIcon,
  AddIcon,
  EditIcon,
  LinkIcon,
  ExternalLinkIcon,
} from "@chakra-ui/icons";

import {
  Badge,
  Divider,
  Flex,
  Img,
  InputRightElement,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Spinner,
} from "@chakra-ui/react";

import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import {
  Box,
  InputGroup,
  InputLeftAddon,
  Input,
  FormControl,
  FormLabel,
  Textarea,
  Stack,
  Radio,
  RadioGroup,
  Button,
  IconButton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Select,
  Switch,
  FormErrorMessage,
  Heading,
  Text,
  useDisclosure,
} from "@chakra-ui/react";

import Header from "../components/Header";

import BarcodeScannerComponent from "react-webcam-barcode-scanner";
import html2canvas from "html2canvas";
import LoadingCard from "../components/LoadingCard";
import OrderReciept from "../components/OrderReciept";
import ImageModal from "../components/ImageModal";

//product.product_image is treated as id for product
const OrderEdit = (props) => {
  const [orderDetails, setOrderDetails] = useState({});
  const [isOpenAlert, setIsOpenAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);

  const [popupImage, setPopupImage] = useState("");
  const [qrResult, setQrResult] = useState("");
  const [recieptOpen, setRecieptOpen] = useState(false);
  const cancelRef = useRef();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isImageOpen,
    onOpen: onImageOpen,
    onClose: onImageClose,
  } = useDisclosure();
  const history = useHistory();

  const productId = props.match.params.id;

  //get details of order
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`*,order_products (*)`)
        .eq("id", productId);
      console.log(error);
      console.log(data);
      setOrderDetails(data[0]);
    };
    fetchData();
  }, []);

  const updateOrder = async () => {
    setIsOpenAlert(false);
    onOpen();
    const { id, order_products, ...updatedOrderDetails } = orderDetails;
    setIsLoading(true);
    console.log(updatedOrderDetails);
    const { data, error } = await supabase
      .from("orders")
      .update(updatedOrderDetails)
      .eq("id", orderDetails.id);

    if (!error) {
      setIsLoading(false);
      setTimeout(() => {
        onClose();
      }, 2000);
    }

    console.log(error);
  };

  const handleImageClick = (imageUrl) => {
    setPopupImage(imageUrl);
    onImageOpen();
  };

  const downloadReciept = () => {
    setRecieptOpen(true);
    setTimeout(async () => {
      const node = document.getElementById("order_reciept");
      html2canvas(node, {
        allowTaint: true,
        useCORS: true,
        logging: true,
      }).then((img) =>
        saveAs(img.toDataURL(), `Order Reciept - ${orderDetails.customer_name}`)
      );
      setRecieptOpen(false);
    }, 100);
  };

  return (
    <>
      <Header title="Order Edit" />
      <div className={styles.container_orderedit}>
        <LoadingCard onClose={onClose} isLoading={isLoading} isOpen={isOpen} />
        <ImageModal
          isImageOpen={isImageOpen}
          onImageClose={onImageClose}
          image={popupImage}
        />

        {recieptOpen && <OrderReciept orderDetails={orderDetails} />}
        <Stack direction="row" justifyContent="space-between">
          <Button
            variant="outline"
            colorScheme="teal"
            mb="10px"
            onClick={downloadReciept}
          >
            Download Reciept
          </Button>
        </Stack>
        <Box borderRadius="10px" backgroundColor="white" p="10px" margin="5px">
          <Stack direction="row" justifyContent="space-between">
            <Heading color="#29283C" fontSize="18px" fontWeight="600">
              Order Details
            </Heading>

            <Popup
              lockScroll={true}
              closeOnDocumentClick={false}
              trigger={<IconButton icon={<EditIcon />} size="sm" />}
              modal
              contentStyle={{ width: "80vw", borderRadius: "10px" }}
              nested
            >
              {(close) => (
                <Box borderRadius="10px" p="15px">
                  <FormLabel mt="10px">Order Status</FormLabel>
                  <Select
                    value={orderDetails.order_status}
                    onChange={(e) => {
                      setOrderDetails((old) => ({
                        ...old,
                        order_status: e.target.value,
                      }));
                    }}
                    mb="20px"
                  >
                    <option value="RECIEVED">RECIEVED</option>
                    <option value="PACKED">PACKED</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="RETURNED">RETURNED</option>
                    <option value="REFUNDED">REFUNDED</option>
                  </Select>

                  {orderDetails.payment_mode !== "COD" && (
                    <>
                      <FormLabel mt="10px"> Payment Status</FormLabel>
                      <Switch
                        size="lg"
                        isChecked={orderDetails.payment_status}
                        onChange={(e) => {
                          setOrderDetails((old) => ({
                            ...old,
                            payment_status: !orderDetails.payment_status,
                          }));
                        }}
                        mb="20px"
                      />

                      <FormLabel>Payment To :</FormLabel>
                      <Select
                        name="payment_to"
                        size="lg"
                        mb="5"
                        value={orderDetails.payment_to || ""}
                        onChange={(e) => {
                          setOrderDetails((old) => ({
                            ...old,
                            payment_to: e.target.value,
                          }));
                        }}
                      >
                        <option value="nasim">Nasim</option>
                        <option value="company">Company</option>
                      </Select>
                    </>
                  )}
                  <FormLabel mt="10px">Remarks</FormLabel>
                  <Textarea
                    value={orderDetails.order_remark || ""}
                    onChange={(e) =>
                      setOrderDetails((old) => ({
                        ...orderDetails,
                        order_remark: e.target.value,
                      }))
                    }
                    size="lg"
                  />

                  <Button
                    onClick={close}
                    ml="65%"
                    colorScheme="teal"
                    mt="10px"
                    w="100px"
                  >
                    Ok
                  </Button>
                </Box>
              )}
            </Popup>
          </Stack>
          <Stack direction="row" mt="2">
            <Text color="#757575" fontWeight="500">
              Order Id :
            </Text>
            <Text colorScheme="black">{orderDetails.id}</Text>
          </Stack>
          <Stack direction="row" mt="2">
            <Text color="#757575" fontWeight="500">
              Date :
            </Text>
            <Text colorScheme="black">
              {new Date(orderDetails.order_date).toLocaleString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </Stack>

          <p>{qrResult}</p>

          <Stack direction="row" mt="2">
            <Text color="#757575" fontWeight="500">
              Status :
            </Text>

            <Badge
              variant="solid"
              colorScheme={
                orderDetails.order_status == "RECIEVED"
                  ? "gray"
                  : ["RETURNED", "CANCELLED"].includes(
                      orderDetails.order_status
                    )
                  ? "red"
                  : "green"
              }
              alignSelf="center"
              size="sm"
              fontSize="15px"
            >
              {orderDetails.order_status}
            </Badge>
          </Stack>
          <Stack direction="row" mt="2">
            <Text color="#757575" fontWeight="500">
              Total Amount :
            </Text>
            <Text colorScheme="black">
              ₹
              {orderDetails.order_products &&
                orderDetails.order_products.reduce(
                  (acc, curr) => acc + curr.product_price,
                  0
                )}
            </Text>
          </Stack>
          <Stack direction="row" mt="2">
            <Text color="#757575" fontWeight="500">
              Payment Mode :
            </Text>
            <Text colorScheme="black">{orderDetails.payment_mode}</Text>
          </Stack>
          {orderDetails.payment_mode !== "COD" && (
            <>
              <Stack direction="row" mt="2">
                <Text color="#757575" fontWeight="500">
                  Payment Status :
                </Text>
                0
                <Badge
                  variant="solid"
                  colorScheme={orderDetails.payment_status ? "green" : "red"}
                  alignSelf="center"
                >
                  {orderDetails.payment_status ? "PAID" : "UNPAID"}
                </Badge>
              </Stack>
              <Stack direction="row" mt="2">
                <Text color="#757575" fontWeight="500">
                  Payment To :
                </Text>
                <Text colorScheme="black">{orderDetails.payment_to}</Text>
              </Stack>
            </>
          )}
          <Stack direction="row" mt="2">
            <Text color="#757575" fontWeight="500">
              Remarks :
            </Text>
            <Text colorScheme="black">{orderDetails.order_remark}</Text>
          </Stack>
        </Box>

        <Box
          borderRadius="10px"
          backgroundColor="white"
          p="10px"
          margin="5px"
          mt="15px"
        >
          <Stack direction="row" justifyContent="space-between">
            <Heading color="#29283C" fontSize="18px" fontWeight="600">
              Customer Details
            </Heading>
            {orderDetails.is_reseller && (
              <Badge
                justifyContent="center"
                variant="solid"
                colorScheme="purple"
                alignSelf="center"
                fontSize="15px"
              >
                Reseller
              </Badge>
            )}
          </Stack>
          <Stack direction="row" mt="2">
            <Text color="#757575" fontWeight="500">
              Name :
            </Text>
            <Text colorScheme="black">{orderDetails.customer_name}</Text>
          </Stack>
          <Stack direction="row" mt="2">
            <Text color="#757575" fontWeight="500">
              Mobile :
            </Text>
            <Text colorScheme="black">{orderDetails.customer_phone}</Text>
            <IconButton
              icon={<ExternalLinkIcon />}
              size="sm"
              onClick={() => window.open(`tel:${orderDetails.customer_phone}`)}
            />
          </Stack>
          <Stack direction="row" mt="2">
            <Text color="#757575" fontWeight="500">
              Pincode :
            </Text>
            <Text colorScheme="black">{orderDetails.customer_pincode}</Text>
          </Stack>
          <Stack direction="row" mt="2">
            <Text color="#757575" fontWeight="500">
              Instagram :
            </Text>
            <Text colorScheme="black">{orderDetails.customer_instagram}</Text>
            <IconButton
              icon={<ExternalLinkIcon />}
              size="sm"
              onClick={() =>
                window.open(
                  `instagram://user?username=${orderDetails.customer_instagram}`
                )
              }
            />
          </Stack>
          <Stack spacing="5" direction="row" mt="2">
            <Text color="#757575" fontWeight="500">
              Address :
            </Text>
            <Text colorScheme="black">{orderDetails.customer_address}</Text>
          </Stack>
          {orderDetails.is_reseller && (
            <Stack spacing="5" direction="row" mt="2">
              <Text color="#757575" fontWeight="500">
                From Address :
              </Text>
              <Text colorScheme="black">{orderDetails.from_address}</Text>
            </Stack>
          )}
        </Box>

        <Box
          borderRadius="10px"
          backgroundColor="white"
          p="10px"
          margin="5px"
          mt="10px"
        >
          <Heading color="#29283C" fontSize="18px" fontWeight="600" mb="10px">
            Order Products
          </Heading>
          {orderDetails.order_products &&
            orderDetails.order_products.map((product) => (
              <Box
                borderRadius="5px"
                borderWidth="2px"
                p="10px"
                mb="8px"
                key={product.id}
              >
                <Stack direction="row">
                  <Img
                    onClick={() =>
                      handleImageClick(
                        `https://firebasestorage.googleapis.com/v0/b/abony-cd5c4.appspot.com/o/${product.product_image}?alt=media`
                      )
                    }
                    className={styles.product_image}
                    src={`https://firebasestorage.googleapis.com/v0/b/abony-cd5c4.appspot.com/o/${product.product_image}?alt=media`}
                    borderRadius="10px"
                  />
                  <Stack direction="column" spacing="0px">
                    <Stack spacing="5" direction="row" mt="2">
                      <Text color="#757575" fontWeight="500">
                        Barcode :
                      </Text>
                      <Text colorScheme="black">{product.product_barcode}</Text>
                    </Stack>
                    <Stack spacing="5" direction="row" mt="2">
                      <Text color="#757575" fontWeight="500">
                        Price :
                      </Text>
                      <Text colorScheme="black">₹{product.product_price}</Text>
                    </Stack>
                    <Stack spacing="5" direction="row" mt="2">
                      <Text color="#757575" fontWeight="500">
                        Size :
                      </Text>
                      <Text colorScheme="black">{product.product_size}</Text>
                    </Stack>
                    <Stack spacing="5" direction="row" mt="2">
                      <Text color="#757575" fontWeight="500">
                        From :
                      </Text>
                      <Text colorScheme="black">{product.product_from}</Text>
                    </Stack>
                  </Stack>
                </Stack>
              </Box>
            ))}
        </Box>

        <Box
          borderRadius="10px"
          backgroundColor="white"
          p="10px"
          margin="5px"
          mt="15px"
          mb="100px"
        >
          <Stack direction="row" justifyContent="space-between">
            <Heading color="#29283C" fontSize="18px" fontWeight="600">
              Courier Details
            </Heading>
            <Popup
              lockScroll="true"
              modal="true"
              trigger={<IconButton icon={<EditIcon />} size="sm" />}
              contentStyle={{ width: "80vw", borderRadius: "10px" }}
              nested
              closeOnDocumentClick={false}
            >
              {(close) => (
                <Box p="15px">
                  <FormLabel>Shipping Partner</FormLabel>
                  <Select
                    value={orderDetails.shipping_partner || ""}
                    onChange={(e) => {
                      setOrderDetails((old) => ({
                        ...old,
                        shipping_partner: e.target.value,
                      }));
                    }}
                    mb="20px"
                  >
                    <option value="none">NONE</option>
                    <option value="DELHIVERY">DELHIVERY</option>
                    <option value="DTDC">DTDC</option>
                    <option value="SHIPROCKET">SHIPROCKET</option>
                    <option value="HAND">HAND</option>
                  </Select>
                  <FormLabel>AWB Number</FormLabel>
                  <InputGroup size="lg">
                    <Input
                      type="text"
                      value={orderDetails.shipping_awb || ""}
                      onChange={(e) => {
                        setOrderDetails((old) => ({
                          ...old,
                          shipping_awb: e.target.value,
                        }));
                      }}
                    />

                    <InputRightElement width="4.5rem">
                      <IconButton
                        icon={<Img src={qricon} w="20px" />}
                        onClick={() => setIsBarcodeOpen((old) => !old)}
                      />
                    </InputRightElement>
                  </InputGroup>
                  {isBarcodeOpen && (
                    <BarcodeScannerComponent
                      width={500}
                      height={50}
                      onUpdate={(err, result) => {
                        if (result) {
                          setOrderDetails((old) => ({
                            ...old,
                            shipping_awb: result.text,
                          }));
                          setIsBarcodeOpen(false);
                        } else setQrResult("Not Found");
                      }}
                    />
                  )}
                  <FormLabel mt="5"> Shipping charge</FormLabel>
                  <Input
                    type="number"
                    value={orderDetails.shipping_charge || ""}
                    onChange={(e) =>
                      setOrderDetails({
                        ...orderDetails,
                        shipping_charge: e.target.value,
                      })
                    }
                  />
                  <FormLabel mt="10px">Shipping Date :</FormLabel>
                  <DatePicker
                    format="dd/MM/yyyy"
                    value={orderDetails.shipping_date || ""}
                    onChange={(date) => {
                      setOrderDetails({ ...orderDetails, shipping_date: date });
                    }}
                  />
                  <FormLabel mt="15px">Delivered Date :</FormLabel>
                  <DatePicker
                    format="dd/MM/yyyy"
                    value={orderDetails.shipping_delivered_date || ""}
                    onChange={(date) => {
                      setOrderDetails({
                        ...orderDetails,
                        shipping_delivered_date: date,
                      });
                    }}
                  />
                  <Button
                    onClick={close}
                    ml="65%"
                    colorScheme="teal"
                    mt="10px"
                    w="100px"
                  >
                    Ok
                  </Button>
                </Box>
              )}
            </Popup>
          </Stack>
          <Stack direction="row" mt="2">
            <Text color="#757575" fontWeight="500">
              Partner :
            </Text>
            <Text colorScheme="black">{orderDetails.shipping_partner}</Text>
          </Stack>
          <Stack direction="row" mt="2">
            <Text color="#757575" fontWeight="500">
              AWB No :
            </Text>
            <Text colorScheme="black">{orderDetails.shipping_awb}</Text>
          </Stack>
          <Stack direction="row" mt="2">
            <Text color="#757575" fontWeight="500">
              Charge :
            </Text>
            <Text colorScheme="black">{orderDetails.shipping_charge}</Text>
          </Stack>
          <Stack direction="row" mt="2">
            <Text color="#757575" fontWeight="500">
              Shipping Date :
            </Text>
            <Text colorScheme="black">
              {orderDetails.shipping_date &&
                new Date(orderDetails.shipping_date).toLocaleDateString()}
            </Text>
          </Stack>
          <Stack direction="row" mt="2">
            <Text color="#757575" fontWeight="500">
              Delivered Date :
            </Text>
            <Text colorScheme="black">
              {orderDetails.shipping_delivered_date &&
                new Date(
                  orderDetails.shipping_delivered_date
                ).toLocaleDateString()}
            </Text>
          </Stack>
        </Box>

        <Button
          position="fixed"
          bottom="0"
          colorScheme="teal"
          variant="solid"
          size="lg"
          w="92%"
          height="50px"
          padding="6"
          mt="6"
          mb="6"
          isLoading={isLoading}
          loadingText="Uploading"
          onClick={() => setIsOpenAlert(true)}
        >
          Update order
        </Button>
        <AlertDialog
          isOpen={isOpenAlert}
          leastDestructiveRef={cancelRef}
          onClose={() => setIsOpenAlert(false)}
          isCentered
        >
          <AlertDialogOverlay>
            <AlertDialogContent w="90%" pos="center">
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Update Order
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to update this order ?
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={() => setIsOpenAlert(false)}>
                  Cancel
                </Button>
                <Button colorScheme="green" ml={3} onClick={updateOrder}>
                  Update
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </div>
    </>
  );
};

export default OrderEdit;
