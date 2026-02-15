import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Button, Stack, Typography } from "@mui/material";
import useDeviceDetect from "../../hooks/useDeviceDetect";
import { PropertyLocation, PropertyType, PropertyRentPeriod } from "../../enums/property.enum";
import { REACT_APP_API_URL, propertySquare } from "../../config";
import { PropertyInput } from "../../types/property/property.input";
import axios from "axios";
import { getJwtToken } from "../../auth";
import {
  sweetErrorHandling,
  sweetMixinErrorAlert,
  sweetMixinSuccessAlert,
} from "../../sweetAlert";
import { useMutation, useQuery, useReactiveVar } from "@apollo/client";
import { userVar } from "../../../apollo/store";
import { CREATE_PROPERTY, UPDATE_PROPERTY } from "../../../apollo/user/mutation";
import { GET_PROPERTY } from "../../../apollo/user/query";

const AddProperty = ({ initialValues, ...props }: any) => {
  const device = useDeviceDetect();
  const router = useRouter();
  const inputRef = useRef<any>(null);

  const [insertPropertyData, setInsertPropertyData] = useState<PropertyInput>(initialValues);

  const [propertyType] = useState<PropertyType[]>(
    Object.values(PropertyType) as PropertyType[]
  );
  const [propertyLocation] = useState<PropertyLocation[]>(
    Object.values(PropertyLocation) as PropertyLocation[]
  );

  // ✅ Rent periods
  const [rentPeriods] = useState<PropertyRentPeriod[]>(
    Object.values(PropertyRentPeriod) as PropertyRentPeriod[]
  );

  const token = getJwtToken();
  const user = useReactiveVar(userVar);

  /** APOLLO REQUESTS **/
  const [updateProperty] = useMutation(UPDATE_PROPERTY);
  const [createProperty] = useMutation(CREATE_PROPERTY);

  const { loading: getPropertyLoading, data: getPropertyData } = useQuery(GET_PROPERTY, {
    fetchPolicy: "network-only",
    variables: { input: router.query.propertyId },
    skip: !router.query.propertyId,
  });

  /** LIFECYCLES **/
  useEffect(() => {
    if (!router.query.propertyId) return;

    setInsertPropertyData({
      ...insertPropertyData,
      propertyTitle: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyTitle : "",
      propertyPrice: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyPrice : 0,
      propertyType: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyType : ("" as any),
      propertyLocation: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyLocation : ("" as any),
      propertyAddress: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyAddress : "",
      propertyBarter: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyBarter : false,
      propertyRent: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyRent : false,

      // ✅ periodni ham olib kelamiz
      propertyRentPeriod: getPropertyData?.getProperty
        ? (getPropertyData?.getProperty?.propertyRentPeriod || PropertyRentPeriod.MONTHLY)
        : PropertyRentPeriod.MONTHLY,

      propertyRooms: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyRooms : 0,
      propertyBeds: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyBeds : 0,
      propertySquare: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertySquare : 0,
      propertyDesc: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyDesc : "",
      propertyImages: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyImages : [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getPropertyLoading, getPropertyData]);

  /** HANDLERS **/
  async function uploadImages() {
    try {
      const formData = new FormData();
      const selectedFiles = inputRef.current.files;

      if (selectedFiles.length == 0) return false;
      if (selectedFiles.length > 5) throw new Error("Cannot upload more than 5 images!");

      formData.append(
        "operations",
        JSON.stringify({
          query: `mutation ImagesUploader($files: [Upload!]!, $target: String!) {
            imagesUploader(files: $files, target: $target)
          }`,
          variables: {
            files: [null, null, null, null, null],
            target: "property",
          },
        })
      );

      formData.append(
        "map",
        JSON.stringify({
          "0": ["variables.files.0"],
          "1": ["variables.files.1"],
          "2": ["variables.files.2"],
          "3": ["variables.files.3"],
          "4": ["variables.files.4"],
        })
      );

      for (const key in selectedFiles) {
        if (/^\d+$/.test(key)) formData.append(`${key}`, selectedFiles[key]);
      }

      const response = await axios.post(`${process.env.REACT_APP_API_GRAPHQL_URL}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "apollo-require-preflight": true,
          Authorization: `Bearer ${token}`,
        },
      });

      const responseImages = response.data.data.imagesUploader;

      setInsertPropertyData({
        ...insertPropertyData,
        propertyImages: responseImages,
      });
    } catch (err: any) {
      console.log("err: ", err.message);
      await sweetMixinErrorAlert(err.message);
    }
  }

  const doDisabledCheck = () => {
    if (
      insertPropertyData.propertyTitle === "" ||
      insertPropertyData.propertyPrice === 0 ||
      // @ts-ignore
      insertPropertyData.propertyType === "" ||
      // @ts-ignore
      insertPropertyData.propertyLocation === "" ||
      insertPropertyData.propertyAddress === "" ||
      insertPropertyData.propertyRooms === 0 ||
      insertPropertyData.propertyBeds === 0 ||
      insertPropertyData.propertySquare === 0 ||
      insertPropertyData.propertyDesc === "" ||
      insertPropertyData.propertyImages.length === 0
    ) return true;

    // ✅ agar rent yes bo‘lsa period tanlangan bo‘lsin
    if (insertPropertyData.propertyRent && !insertPropertyData.propertyRentPeriod) return true;

    return false;
  };

  const insertPropertyHandler = useCallback(async () => {
    try {
      const payload: any = { ...insertPropertyData };

      // ✅ rent emas bo‘lsa period yubormaymiz
      if (!payload.propertyRent) payload.propertyRentPeriod = undefined;

      await createProperty({
        variables: { input: payload },
      });

      await sweetMixinSuccessAlert("This property has been created successfuly");
      await router.push({ pathname: "/mypage", query: { category: "myProperties" } });
    } catch (err) {
      sweetErrorHandling(err).then();
    }
  }, [insertPropertyData]);

  const updatePropertyHandler = useCallback(async () => {
    try {
      const payload: any = { ...insertPropertyData };
      payload._id = getPropertyData?.getProperty?._id;

      if (!payload.propertyRent) payload.propertyRentPeriod = undefined;

      await updateProperty({
        variables: { input: payload },
      });

      await sweetMixinSuccessAlert("This porperty has been updated successfully");
      await router.push({ pathname: "/mypage", query: { category: "myProperties" } });
    } catch (err) {
      sweetErrorHandling(err).then();
    }
  }, [insertPropertyData, getPropertyData]);

  if (device === "mobile") {
    return <div>ADD NEW PROPERTY MOBILE PAGE</div>;
  }

  return (
    <div id="add-property-page">
      <Stack className="main-title-box">
        <Typography className="main-title">Add New Property</Typography>
        <Typography className="sub-title">We are glad to see you again!</Typography>
      </Stack>

      <div>
        <Stack className="config">
          <Stack className="description-box">
            <Stack className="config-column">
              <Typography className="title">Title</Typography>
              <input
                type="text"
                className="description-input"
                placeholder={"Title"}
                value={insertPropertyData.propertyTitle}
                onChange={({ target: { value } }) =>
                  setInsertPropertyData({ ...insertPropertyData, propertyTitle: value })
                }
              />
            </Stack>

            <Stack className="config-row">
              <Stack className="price-year-after-price">
                <Typography className="title">Price</Typography>
                <input
                  type="text"
                  className="description-input"
                  placeholder={"Price"}
                  value={insertPropertyData.propertyPrice}
                  onChange={({ target: { value } }) =>
                    setInsertPropertyData({ ...insertPropertyData, propertyPrice: parseInt(value || "0") })
                  }
                />
              </Stack>

              <Stack className="price-year-after-price">
                <Typography className="title">Fuel Type</Typography>
                <select
                  className={"select-description"}
                  value={insertPropertyData.propertyType || "select"}
                  onChange={({ target: { value } }) =>
                    setInsertPropertyData({ ...insertPropertyData, propertyType: value as any })
                  }
                >
                  <option disabled value={"select"}>Select</option>
                  {propertyType.map((type: any) => (
                    <option value={`${type}`} key={type}>{type}</option>
                  ))}
                </select>
                <div className={"divider"}></div>
                <img src={"/img/icons/Vector.svg"} className={"arrow-down"} />
              </Stack>
            </Stack>

            <Stack className="config-row">
              <Stack className="price-year-after-price">
                <Typography className="title">Location</Typography>
                <select
                  className={"select-description"}
                  value={insertPropertyData.propertyLocation || "select"}
                  onChange={({ target: { value } }) =>
                    setInsertPropertyData({ ...insertPropertyData, propertyLocation: value as any })
                  }
                >
                  <option disabled value={"select"}>Select</option>
                  {propertyLocation.map((location: any) => (
                    <option value={`${location}`} key={location}>{location}</option>
                  ))}
                </select>
                <div className={"divider"}></div>
                <img src={"/img/icons/Vector.svg"} className={"arrow-down"} />
              </Stack>

              <Stack className="price-year-after-price">
                <Typography className="title">Address</Typography>
                <input
                  type="text"
                  className="description-input"
                  placeholder={"Address"}
                  value={insertPropertyData.propertyAddress}
                  onChange={({ target: { value } }) =>
                    setInsertPropertyData({ ...insertPropertyData, propertyAddress: value })
                  }
                />
              </Stack>
            </Stack>

            <Stack className="config-row">
              <Stack className="price-year-after-price">
                <Typography className="title">Trade</Typography>
                <select
                  className={"select-description"}
                  value={insertPropertyData.propertyBarter ? "yes" : "no"}
                  onChange={({ target: { value } }) =>
                    setInsertPropertyData({ ...insertPropertyData, propertyBarter: value === "yes" })
                  }
                >
                  <option value={"yes"}>Yes</option>
                  <option value={"no"}>No</option>
                </select>
                <div className={"divider"}></div>
                <img src={"/img/icons/Vector.svg"} className={"arrow-down"} />
              </Stack>

              <Stack className="price-year-after-price">
                <Typography className="title">Lease</Typography>
                <select
                  className={"select-description"}
                  value={insertPropertyData.propertyRent ? "yes" : "no"}
                  onChange={({ target: { value } }) => {
                    const isRent = value === "yes";
                    setInsertPropertyData({
                      ...insertPropertyData,
                      propertyRent: isRent,
                      propertyRentPeriod: isRent
                        ? (insertPropertyData.propertyRentPeriod || PropertyRentPeriod.MONTHLY)
                        : undefined,
                    });
                  }}
                >
                  <option value={"yes"}>Yes</option>
                  <option value={"no"}>No</option>
                </select>
                <div className={"divider"}></div>
                <img src={"/img/icons/Vector.svg"} className={"arrow-down"} />
              </Stack>

              {/* ✅ faqat Lease=Yes bo‘lsa period chiqadi */}
              {insertPropertyData.propertyRent && (
                <Stack className="price-year-after-price">
                  <Typography className="title">Lease Period</Typography>
                  <select
                    className={"select-description"}
                    value={insertPropertyData.propertyRentPeriod || PropertyRentPeriod.MONTHLY}
                    onChange={({ target: { value } }) =>
                      setInsertPropertyData({ ...insertPropertyData, propertyRentPeriod: value as any })
                    }
                  >
                    {rentPeriods.map((p) => (
                      <option value={p} key={p}>
                        {p === "DAILY" ? "Daily" : p === "MONTHLY" ? "Monthly" : "Yearly"}
                      </option>
                    ))}
                  </select>
                  <div className={"divider"}></div>
                  <img src={"/img/icons/Vector.svg"} className={"arrow-down"} />
                </Stack>
              )}
            </Stack>

            <Stack className="config-row">
              <Stack className="price-year-after-price">
                <Typography className="title">Transmission</Typography>
                <select
                  className={"select-description"}
                  value={insertPropertyData.propertyRooms || "select"}
                  onChange={({ target: { value } }) =>
                    setInsertPropertyData({ ...insertPropertyData, propertyRooms: parseInt(value || "0") })
                  }
                >
                  <option disabled value={"select"}>Select</option>
                  {[1, 2, 3, 4, 5].map((room: number) => (
                    <option value={`${room}`} key={room}>{room}</option>
                  ))}
                </select>
                <div className={"divider"}></div>
                <img src={"/img/icons/Vector.svg"} className={"arrow-down"} />
              </Stack>

              <Stack className="price-year-after-price">
                <Typography className="title">Seats</Typography>
                <select
                  className={"select-description"}
                  value={insertPropertyData.propertyBeds || "select"}
                  onChange={({ target: { value } }) =>
                    setInsertPropertyData({ ...insertPropertyData, propertyBeds: parseInt(value || "0") })
                  }
                >
                  <option disabled value={"select"}>Select</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((bed: number) => (
                    <option value={`${bed}`} key={bed}>{bed}</option>
                  ))}
                </select>
                <div className={"divider"}></div>
                <img src={"/img/icons/Vector.svg"} className={"arrow-down"} />
              </Stack>

              <Stack className="price-year-after-price">
                <Typography className="title">Mileage (km)</Typography>
                <select
                  className={"select-description"}
                  value={insertPropertyData.propertySquare || "select"}
                  onChange={({ target: { value } }) =>
                    setInsertPropertyData({ ...insertPropertyData, propertySquare: parseInt(value || "0") })
                  }
                >
                  <option disabled value={"select"}>Select</option>
                  {propertySquare.map((sq: number) => {
                    if (sq !== 0) return <option value={`${sq}`} key={sq}>{sq}</option>;
                    return null;
                  })}
                </select>
                <div className={"divider"}></div>
                <img src={"/img/icons/Vector.svg"} className={"arrow-down"} />
              </Stack>
            </Stack>

            <Typography className="property-title">Property Description</Typography>
            <Stack className="config-column">
              <Typography className="title">Description</Typography>
              <textarea
                className="description-text"
                value={insertPropertyData.propertyDesc}
                onChange={({ target: { value } }) =>
                  setInsertPropertyData({ ...insertPropertyData, propertyDesc: value })
                }
              ></textarea>
            </Stack>
          </Stack>

          <Typography className="upload-title">Upload photos of your property</Typography>

          <Stack className="images-box">
            <Stack className="upload-box">
              <Stack className="text-box">
                <Typography className="drag-title">Drag and drop images here</Typography>
                <Typography className="format-title">
                  Photos must be JPEG or PNG format and least 2048x768
                </Typography>
              </Stack>

              <Button className="browse-button" onClick={() => inputRef.current.click()}>
                <Typography className="browse-button-text">Browse Files</Typography>
                <input
                  ref={inputRef}
                  type="file"
                  hidden={true}
                  onChange={uploadImages}
                  multiple={true}
                  accept="image/jpg, image/jpeg, image/png"
                />
              </Button>
            </Stack>

            <Stack className="gallery-box">
              {insertPropertyData?.propertyImages.map((image: string) => {
                const imagePath: string = `${REACT_APP_API_URL}${image}`;
                return (
                  <Stack className="image-box" key={image}>
                    <img src={imagePath} alt="" />
                  </Stack>
                );
              })}
            </Stack>
          </Stack>

          <Stack className="buttons-row">
            {router.query.propertyId ? (
              <Button className="next-button" disabled={doDisabledCheck()} onClick={updatePropertyHandler}>
                <Typography className="next-button-text">Save</Typography>
              </Button>
            ) : (
              <Button className="next-button" disabled={doDisabledCheck()} onClick={insertPropertyHandler}>
                <Typography className="next-button-text">Save</Typography>
              </Button>
            )}
          </Stack>
        </Stack>
      </div>
    </div>
  );
};

AddProperty.defaultProps = {
  initialValues: {
    propertyTitle: "",
    propertyPrice: 0,
    propertyType: "",
    propertyLocation: "",
    propertyAddress: "",
    propertyBarter: false,
    propertyRent: false,

    // ✅ default
    propertyRentPeriod: PropertyRentPeriod.MONTHLY,

    propertyRooms: 0,
    propertyBeds: 0,
    propertySquare: 0,
    propertyDesc: "",
    propertyImages: [],
  },
};

export default AddProperty;
