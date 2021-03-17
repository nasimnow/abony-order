import { React, useRef, useState, useEffect } from "react";
import styles from "./css/addOrder.module.scss";
import imageCompression from "browser-image-compression";
import { v4 as uuidv4 } from "uuid";
import { useHistory } from "react-router-dom";
import backIcon from "../assets/backIcon.png";
import { useFormLocal } from "../components/useFormLocal";
import DatePicker from "react-date-picker";
import supabase from "../supabase";
import "react-datepicker/dist/react-datepicker.css";
import { CloseIcon, AddIcon } from "@chakra-ui/icons";
import firebase from "../firebase";

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
} from "@chakra-ui/react";

//product.product_image is treated as id for product
const AddOrder = () => {
  const [paymentMode, setPaymentMethod] = useState("BANK");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder, updateOrder] = useFormLocal([]);
  const [orderProducts, setOrderProducts] = useState([
    {
      product_barcode: "",
      convertedimage: "",
      product_image: uuidv4(),
      product_type: "TOP",
      product_price: "",
      product_size: "",
      product_from: "SHOP",
    },
  ]);
  const [isValidationError, setIsValidationError] = useState(false);
  const cancelRef = useRef();
  const history = useHistory();
  const storageRef = firebase.storage().ref();

  //default state values setting
  useEffect(() => {
    setOrder({
      order_date: new Date(),
      is_reseller: false,
      payment_to: "nasim",
      payment_status: true,
    });
  }, []);

  //change or edit products array in state
  const handleOrderProduct = (name, value, id) => {
    let index = orderProducts.findIndex((order) => order.product_image === id);
    console.log(index);
    let newArray = [...orderProducts];
    newArray[index] = {
      ...newArray[index],
      [name]: value,
    };

    setOrderProducts(newArray);
  };

  const deleteOrderProduct = (id) => {
    let newArr = orderProducts.filter(
      (product) => product.product_image !== id
    );

    setOrderProducts(newArr);
  };

  //add product to products state
  const addOrderProduct = () => {
    const newId = uuidv4();
    const newProducts = {
      product_barcode: "",
      convertedimage: "",
      product_image: newId,
      product_type: "TOP",
      product_price: "",
      product_size: "",
      product_from: "SHOP",
    };
    setOrderProducts((old) => [...old, newProducts]);
  };

  //   add order to server
  const addOrder = async () => {
    setIsOpen(false);
    // setIsLoading(true);

    const orderObject = {
      ...order,
      payment_mode: paymentMode,
      order_status: "RECIEVED",
    };

    const orderResponse = await supabase.from("orders").insert([orderObject]);

    //upoad images to firebase storage
    let imagesArr = [...orderProducts].map((product) => product.convertedimage);
    console.log(imagesArr);
    await imageToServer(imagesArr);

    //adding foreign key of order to oreder products

    const newOrderProducts = [...orderProducts].map((product) => {
      delete product.convertedimage;
      return {
        ...product,
        product_order_id: orderResponse.data[0].id,
      };
    });
    const orderProductsResponse = await supabase
      .from("order_products")
      .insert(newOrderProducts);

    console.log(orderProductsResponse);
  };

  const imageToServer = async (imagesArr) => {
    console.log(imagesArr);
    for (const image of imagesArr) {
      console.log(image);
      const imageRef = storageRef.child(`${image.name}`);
      imageRef.put(image).then((snapshot) => {
        console.log("Uploaded a blob or file!");
      });
    }
  };

  const valdateFields = async (addCallback) => {
    //validate order details
    if (
      order.customer_name ||
      order.customer_instagram ||
      order.customer_phone ||
      order.customer_address
    ) {
      //validate order products
      const isproducts = orderProducts.filter(
        (product) =>
          !product.product_barcode ||
          !product.product_price ||
          !product.product_size
      );
      if (isproducts.length > 0) {
        setIsOpen(false);
        setIsValidationError(true);
      } else {
        setIsOpen(true);
        setIsValidationError(false);
      }
    } else {
      setIsOpen(false);
      setIsValidationError(true);
    }
  };

  //     const response = await addOrderAPI({
  //       ...order,
  //       payment_method: paymentMethod,
  //       products: orderProducts,
  //     });
  //     await imageToServer();

  //     setIsLoading(false);
  //     history.push("/orders");
  //   };
  //   const imageToServer = async () => {
  //
  //   };
  //   const validateFields = async (addCallback) => {
  //     const isproducts = orderProducts.filter(
  //       (product) => !product.code || !product.price || !product.size
  //     );
  //     if (!order.name || !order.address || isproducts.length > 0) {
  //       setIsOpen(false);
  //       setIsValidationError(true);
  //     } else {
  //       setIsValidationError(false);
  //       setIsOpen(false);
  //       setIsValidationError(false);
  //       addCallback();
  //     }

  const compressImage = async (event, productId) => {
    //compresses image to below 1MB
    const options = {
      maxSizeMB: 0.6,
      maxWidthOrHeight: 1280,
      useWebWorker: true,
    };
    try {
      const compressedFile = await imageCompression(
        event.target.files[0],
        options
      );
      compressedFile.lastModifiedDate = new Date();
      const convertedBlobFile = new File([compressedFile], productId, {
        type: compressedFile.type,
        lastModified: Date.now(),
        name: productId,
      });

      handleOrderProduct("convertedimage", convertedBlobFile, productId);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => history.goBack()}>
          <img src={backIcon} className={styles.backIcon} alt="back_icon" />
        </button>
        <h1 className={styles.label}>Add Order</h1>
      </div>
      <div className={styles.container}>
        <FormControl w="90%" mt="2" isRequired>
          <FormLabel>Order Date :</FormLabel>
          <DatePicker
            format="dd/MM/yyyy"
            value={order.order_date}
            onChange={(date) => {
              setOrder({ order_date: date });
            }}
          />
        </FormControl>
        <FormControl w="90%" mt="2" isRequired>
          <FormLabel>Customer Name :</FormLabel>
          <Input
            type="text"
            size="lg"
            name="customer_name"
            value={order.customer_name || ""}
            onChange={updateOrder}
          />
        </FormControl>
        <FormControl w="90%" mt="2" isRequired>
          <FormLabel>Instagram Id :</FormLabel>
          <Input
            type="text"
            size="lg"
            name="customer_instagram"
            value={order.customer_instagram || ""}
            onChange={updateOrder}
          />
        </FormControl>
        <FormControl w="90%" mt="2" isRequired>
          <FormLabel>Mobile :</FormLabel>
          <Input
            type="number"
            size="lg"
            name="customer_phone"
            value={order.customer_phone || ""}
            onChange={updateOrder}
          />
        </FormControl>
        <FormControl id="customer_address" w="90%" mt="2" isRequired>
          <FormLabel>Address :</FormLabel>
          <Textarea
            type="text"
            size="lg"
            rows="4"
            name="customer_address"
            onChange={updateOrder}
            value={order.customer_address}
          />
        </FormControl>
        <FormControl w="90%" display="flex" mt="2">
          <FormLabel>Reseller</FormLabel>
          <Switch
            id="email-alerts"
            size="lg"
            isChecked={order.is_reseller}
            onChange={(e) => setOrder({ is_reseller: !order.is_reseller })}
          />
        </FormControl>
        {order.is_reseller && (
          <FormControl id="customer_address" w="90%" mt="2" isRequired>
            <FormLabel>From Address :</FormLabel>
            <Textarea
              type="text"
              size="lg"
              rows="4"
              name="from_address"
              onChange={updateOrder}
              value={order.from_address}
            />
          </FormControl>
        )}

        {/* products start */}
        {/* productt.image is used as id */}
        {orderProducts.map((product) => (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              width: "90%",
            }}
            key={product.product_image}
          >
            <Box
              rounded="md"
              bg="white"
              boxShadow="xs"
              w="100%"
              mt="3"
              d="flex"
              alignItems="center"
              flexDirection="column"
              position="relative"
            >
              <IconButton
                icon={<CloseIcon />}
                position="absolute"
                top="2"
                right="2"
                borderRadius="full"
                onClick={() => deleteOrderProduct(product.product_image)}
              />

              {product.convertedimage && (
                <img
                  src={URL.createObjectURL(product.convertedimage)}
                  width="200"
                />
              )}
              {/* <label htmlFor="file-upload" className={styles.customFileUpload}>
                <AddIcon w={8} h={8} />
              </label> */}
              <input
                type="file"
                accept="image/*"
                id="file-upload"
                className={styles.fileUpload}
                name="product_image"
                onChange={(event) => {
                  console.log("from", product);
                  compressImage(event, product.product_image);
                }}
              />

              <FormControl w="90%" mt="2" isRequired>
                <FormLabel>Barcode :</FormLabel>
                <Input
                  type="text"
                  size="lg"
                  name="product_barcode"
                  value={product.product_barcode}
                  onChange={(e) =>
                    handleOrderProduct(
                      e.target.name,
                      e.target.value,
                      product.product_image
                    )
                  }
                />
              </FormControl>
              <Stack direction="row" w="90%" mt="5">
                <FormControl w="100%" isRequired>
                  <FormLabel>Type :</FormLabel>

                  <Select
                    mb="3"
                    size="lg"
                    name="product_type"
                    onChange={(e) =>
                      handleOrderProduct(
                        e.target.name,
                        e.target.value,
                        product.product_image
                      )
                    }
                    value={product.product_type}
                  >
                    <option value="TOP">Top</option>
                    <option value="PANT">Pant</option>
                    <option value="FULLSET">Full Set</option>
                  </Select>
                </FormControl>
                <FormControl w="90%" isRequired>
                  <FormLabel>From :</FormLabel>
                  <Select
                    mb="3"
                    size="lg"
                    name="product_from"
                    onChange={(e) =>
                      handleOrderProduct(
                        e.target.name,
                        e.target.value,
                        product.product_image
                      )
                    }
                    value={product.product_from}
                  >
                    <option value="SHOP">Shop</option>
                    <option value="OFFICE">Office</option>
                    <option value="AJIO">Ajio</option>
                  </Select>
                </FormControl>
              </Stack>
              <FormControl w="90%" mt="2" isRequired>
                <FormLabel>Size/Color :</FormLabel>
                <Input
                  type="text"
                  size="lg"
                  name="product_size"
                  value={product.product_size}
                  onChange={(e) =>
                    handleOrderProduct(
                      e.target.name,
                      e.target.value,
                      product.product_image
                    )
                  }
                />
              </FormControl>
              <FormControl w="90%" mt="2" mb="5" isRequired>
                <FormLabel>Price :</FormLabel>
                <Input
                  type="number"
                  size="lg"
                  name="product_price"
                  value={product.product_price}
                  onChange={(e) =>
                    handleOrderProduct(
                      e.target.name,
                      e.target.value,
                      product.product_image
                    )
                  }
                />
              </FormControl>
            </Box>
          </div>
        ))}
        <Button
          onClick={addOrderProduct}
          mt="3"
          alignSelf="flex-start"
          ml="3"
          colorScheme="blue"
          type="submit"
        >
          Add Prduct
        </Button>
        {/* products end */}

        <FormControl id="payment_method" w="90%" mt="2" isRequired>
          <FormLabel>Payment Method :</FormLabel>
          <RadioGroup
            onChange={setPaymentMethod}
            value={paymentMode}
            name="payment_mode"
          >
            <Stack direction="row">
              <Radio value="BANK" size="lg">
                BANK
              </Radio>
              <Radio value="COD" size="lg">
                COD
              </Radio>
              <Radio value="CASH" size="lg">
                CASH
              </Radio>
            </Stack>
          </RadioGroup>
        </FormControl>

        {paymentMode === "BANK" && (
          <>
            <FormControl w="90%" mt="5">
              <Stack direction="row">
                <FormControl w="90%">
                  <FormLabel>Payment Status: </FormLabel>
                  <Switch
                    id="email-alerts"
                    size="lg"
                    isChecked={order.payment_status}
                    onChange={(e) =>
                      setOrder({ payment_status: !order.payment_status })
                    }
                  />
                </FormControl>
                <FormControl w="90%" mt="2" isRequired>
                  <FormLabel>To :</FormLabel>
                  <Select
                    name="payment_to"
                    size="lg"
                    mb="5"
                    value={order.payment_to}
                    onChange={updateOrder}
                  >
                    <option value="nasim">Nasim</option>
                    <option value="company">Company</option>
                  </Select>
                </FormControl>
              </Stack>
            </FormControl>
          </>
        )}

        <FormControl w="90%" mt="2">
          <FormLabel>Order Note</FormLabel>
          <Input
            type="text"
            size="lg"
            name="order_remark"
            value={order.order_remark || ""}
            onChange={updateOrder}
          />
        </FormControl>
        {isValidationError && (
          <Alert status="error" mt={2}>
            <AlertIcon />
            <AlertTitle mr={2}>Please Fill All Fields!</AlertTitle>
          </Alert>
        )}
        <Button
          colorScheme="teal"
          variant="solid"
          size="xs"
          w="90%"
          padding="6"
          mt="6"
          mb="6"
          isLoading={isLoading}
          loadingText="Uploading"
          // onClick={() => setIsOpen(true)}
          onClick={() => valdateFields(addOrder)}
        >
          Add order
        </Button>

        <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={() => setIsOpen(false)}
        >
          <AlertDialogOverlay>
            <AlertDialogContent w="90%" pos="center">
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Add Order
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to add this order ?
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button colorScheme="green" ml={3} onClick={addOrder}>
                  Add
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </div>
    </>
  );
};

export default AddOrder;