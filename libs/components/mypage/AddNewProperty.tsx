import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Button, Stack, Typography } from "@mui/material";
import useDeviceDetect from "../../hooks/useDeviceDetect";
import { PropertyLocation, PropertyType, PropertyRentPeriod } from "../../enums/property.enum";
import { REACT_APP_API_URL } from "../../config";
import { PropertyInput } from "../../types/property/property.input";
import axios from "axios";
import { getJwtToken } from "../../auth";
import { sweetErrorHandling, sweetMixinErrorAlert, sweetMixinSuccessAlert } from "../../sweetAlert";
import { useMutation, useQuery, useReactiveVar } from "@apollo/client";
import { userVar } from "../../../apollo/store";
import { CREATE_PROPERTY, UPDATE_PROPERTY } from "../../../apollo/user/mutation";
import { GET_PROPERTY } from "../../../apollo/user/query";
import { TRANSMISSIONS } from "../../utils/transmission";
import { ReactI18NextChild } from "react-i18next";

const MAX_IMAGES = 5;

const joinUrl = (base: string, p: string) => {
  const b = (base || "").replace(/\/$/, "");
  const path = (p || "").replace(/^\//, "");
  return `${b}/${path}`;
};

const normalizeUploadPath = (p: string) => {
  if (!p) return p;
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  return p.startsWith("/") ? p : `/${p}`;
};

const AddProperty = ({ initialValues }: any) => {
  const device = useDeviceDetect();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [insertPropertyData, setInsertPropertyData] = useState<PropertyInput>(initialValues);

  const [propertyType] = useState<PropertyType[]>(Object.values(PropertyType) as PropertyType[]);
  const [propertyLocation] = useState<PropertyLocation[]>(Object.values(PropertyLocation) as PropertyLocation[]);
  const [rentPeriods] = useState<PropertyRentPeriod[]>(Object.values(PropertyRentPeriod) as PropertyRentPeriod[]);

  const token = getJwtToken();
  const user = useReactiveVar(userVar);

  const [updateProperty] = useMutation(UPDATE_PROPERTY);
  const [createProperty] = useMutation(CREATE_PROPERTY);

  const { loading: getPropertyLoading, data: getPropertyData } = useQuery(GET_PROPERTY, {
    fetchPolicy: "network-only",
    variables: { input: router.query.propertyId },
    skip: !router.query.propertyId,
  });

  useEffect(() => {
    if (!router.query.propertyId) return;
    const p = getPropertyData?.getProperty;
    if (!p) return;

    setInsertPropertyData((prev) => ({
      ...prev,
      propertyTitle: p?.propertyTitle ?? "",
      propertyPrice: p?.propertyPrice ?? 0,
      propertyType: p?.propertyType ?? ("" as any),
      propertyLocation: p?.propertyLocation ?? ("" as any),
      propertyAddress: p?.propertyAddress ?? "",
      propertyBarter: p?.propertyBarter ?? false,
      propertyRent: p?.propertyRent ?? false,
      propertyRentPeriod: p?.propertyRentPeriod || PropertyRentPeriod.MONTHLY,
      propertyRooms: p?.propertyRooms ?? 0,
      propertyBeds: p?.propertyBeds ?? 0,
      propertySquare: p?.propertySquare ?? 0, // mileage
      propertyDesc: p?.propertyDesc ?? "",
      propertyImages: (p?.propertyImages ?? []).map(normalizeUploadPath),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getPropertyLoading, getPropertyData]);

  const openFilePicker = () => inputRef.current?.click();

  const removeImage = (img: string) => {
    setInsertPropertyData((prev) => ({
      ...prev,
      propertyImages: (prev.propertyImages || []).filter((x) => x !== img),
    }));
  };

  const GRAPHQL_URL =
    (process.env.NEXT_PUBLIC_API_GRAPHQL_URL as string) ||
    (process.env.NEXT_PUBLIC_REACT_APP_API_GRAPHQL_URL as string) || // ba’zi projectlarda shunaqa bo‘ladi
    (process.env.REACT_APP_API_GRAPHQL_URL as string) || // agar next.config.js bilan clientga chiqayotgan bo‘lsa
    (process.env.NEXT_PUBLIC_GRAPHQL_URL as string) ||
    "";


  const uploadImages = async (files: FileList | File[]) => {
    try {
      const picked = Array.from(files || []).filter((f) => f instanceof File);
      if (picked.length === 0) return;

      const existingCount = insertPropertyData.propertyImages?.length || 0;
      const remaining = MAX_IMAGES - existingCount;

      if (remaining <= 0) throw new Error(`Max ${MAX_IMAGES} images. Remove one to upload new.`);

      const toUpload = picked.slice(0, remaining);

      const operations = {
        query: `mutation ImagesUploader($files: [Upload!]!, $target: String!) {
          imagesUploader(files: $files, target: $target)
        }`,
        variables: {
          files: new Array(toUpload.length).fill(null),
          target: "property",
        },
      };

      const map: Record<string, string[]> = {};
      toUpload.forEach((_, idx) => (map[String(idx)] = [`variables.files.${idx}`]));

      const formData = new FormData();
      formData.append("operations", JSON.stringify(operations));
      formData.append("map", JSON.stringify(map));
      toUpload.forEach((file, idx) => formData.append(String(idx), file));

      // if (!GRAPHQL_URL) throw new Error("GRAPHQL URL missing (NEXT_PUBLIC_API_GRAPHQL_URL)");
      if (!GRAPHQL_URL) {
        console.log("GRAPHQL_URL is empty. Check env variables!");
        throw new Error("Upload config missing. Set NEXT_PUBLIC_API_GRAPHQL_URL");
      }

      const response = await axios.post(GRAPHQL_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "apollo-require-preflight": "true",
          Authorization: `Bearer ${token}`,
        },
      });

      const responseImagesRaw: string[] = response?.data?.data?.imagesUploader ?? [];
      const responseImages = responseImagesRaw.map(normalizeUploadPath);

      setInsertPropertyData((prev) => ({
        ...prev,
        propertyImages: [...(prev.propertyImages || []), ...responseImages].slice(0, MAX_IMAGES),
      }));

      if (inputRef.current) inputRef.current.value = "";
    } catch (err: any) {
      await sweetMixinErrorAlert(err?.message || "Upload failed");
    }
  };

  const doDisabledCheck = () => {
    if (
      !insertPropertyData.propertyTitle ||
      !insertPropertyData.propertyPrice ||
      // @ts-ignore
      !insertPropertyData.propertyType ||
      // @ts-ignore
      !insertPropertyData.propertyLocation ||
      !insertPropertyData.propertyAddress ||
      !insertPropertyData.propertyRooms ||
      !insertPropertyData.propertyBeds ||
      insertPropertyData.propertySquare === 0 ||
      !insertPropertyData.propertyDesc ||
      (insertPropertyData.propertyImages?.length || 0) === 0
    ) return true;

    if (insertPropertyData.propertyRent && !insertPropertyData.propertyRentPeriod) return true;

    return false;
  };
  console.log("PAYLOAD =>", insertPropertyData);
  const insertPropertyHandler = useCallback(async () => {
    try {
      const payload: any = { ...insertPropertyData };
      if (!payload.propertyRent) payload.propertyRentPeriod = undefined;

      await createProperty({ variables: { input: payload } });
      await sweetMixinSuccessAlert("Property created successfully");
      await router.push({ pathname: "/mypage", query: { category: "myProperties" } });
    } catch (err) {
      console.log("CREATE_PROPERTY ERROR:", err);
      // console.log("GRAPHQL ERRORS:", err?.graphQLErrors);
      // console.log("NETWORK ERROR:", err?.networkError);
      sweetErrorHandling(err).then();

    }
  }, [insertPropertyData, createProperty, router]);

  const updatePropertyHandler = useCallback(async () => {
    try {
      const payload: any = { ...insertPropertyData };
      payload._id = getPropertyData?.getProperty?._id;
      if (!payload.propertyRent) payload.propertyRentPeriod = undefined;

      await updateProperty({ variables: { input: payload } });
      await sweetMixinSuccessAlert("Property updated successfully");
      await router.push({ pathname: "/mypage", query: { category: "myProperties" } });
    } catch (err) {
      sweetErrorHandling(err).then();
    }
  }, [insertPropertyData, updateProperty, getPropertyData, router]);

  if (device === "mobile") return <div>ADD NEW PROPERTY MOBILE PAGE</div>;

  const currentImages = insertPropertyData.propertyImages?.length || 0;

  return (
    <div id="add-property-page">
      <Stack className="main-title-box">
        <Typography className="main-title">
          {router.query.propertyId ? "Edit Property" : "Add New Property"}
        </Typography>
        <Typography className="sub-title">Let’s publish a clean listing with great photos.</Typography>
      </Stack>

      <Stack className="config">
        <Stack className="description-box">
          <Stack className="config-column">
            <Typography className="title">Title</Typography>
            <input
              type="text"
              className="description-input"
              placeholder="Title"
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
                type="number"
                className="description-input"
                placeholder="Price"
                min={0}
                value={insertPropertyData.propertyPrice || ""}
                onChange={({ target: { value } }) =>
                  setInsertPropertyData({ ...insertPropertyData, propertyPrice: parseInt(value || "0", 10) })
                }
              />
            </Stack>

            <Stack className="price-year-after-price">
              <Typography className="title">Fuel Type</Typography>
              <select
                className="select-description"
                value={insertPropertyData.propertyType || "select"}
                onChange={({ target: { value } }) =>
                  setInsertPropertyData({ ...insertPropertyData, propertyType: value as any })
                }
              >
                <option disabled value="select">Select</option>
                {propertyType.map((type) => (
                  <option value={type} key={type}>{type}</option>
                ))}
              </select>
            </Stack>
          </Stack>

          <Stack className="config-row">
            <Stack className="price-year-after-price">
              <Typography className="title">Location</Typography>
              <select
                className="select-description"
                value={insertPropertyData.propertyLocation || "select"}
                onChange={({ target: { value } }) =>
                  setInsertPropertyData({ ...insertPropertyData, propertyLocation: value as any })
                }
              >
                <option disabled value="select">Select</option>
                {propertyLocation.map((location) => (
                  <option value={location} key={location}>{location}</option>
                ))}
              </select>
            </Stack>

            <Stack className="price-year-after-price">
              <Typography className="title">Address</Typography>
              <input
                type="text"
                className="description-input"
                placeholder="Address"
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
                className="select-description"
                value={insertPropertyData.propertyBarter ? "yes" : "no"}
                onChange={({ target: { value } }) =>
                  setInsertPropertyData({ ...insertPropertyData, propertyBarter: value === "yes" })
                }
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </Stack>

            <Stack className="price-year-after-price">
              <Typography className="title">Lease</Typography>
              <select
                className="select-description"
                value={insertPropertyData.propertyRent ? "yes" : "no"}
                onChange={({ target: { value } }) => {
                  const isRent = value === "yes";
                  setInsertPropertyData({
                    ...insertPropertyData,
                    propertyRent: isRent,
                    propertyRentPeriod: isRent
                      ? insertPropertyData.propertyRentPeriod || PropertyRentPeriod.MONTHLY
                      : undefined,
                  });
                }}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </Stack>

            {insertPropertyData.propertyRent && (
              <Stack className="price-year-after-price">
                <Typography className="title">Lease Period</Typography>
                <select
                  className="select-description"
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
              </Stack>
            )}
          </Stack>

          <Stack className="config-row">
            <Stack className="price-year-after-price">
              <Typography className="title">Transmission</Typography>
              <select
                className="select-description"
                value={insertPropertyData.propertyRooms ? String(insertPropertyData.propertyRooms) : "select"}
                onChange={({ target: { value } }) =>
                  setInsertPropertyData({
                    ...insertPropertyData,
                    propertyRooms: value === "select" ? 0 : parseInt(value, 10),
                  })
                }
              >
                <option disabled value="select">Select</option>
                {TRANSMISSIONS.map((t: { value: React.Key | null | undefined; label: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | React.ReactFragment | React.ReactPortal | Iterable<ReactI18NextChild> | null | undefined; }) => (
                  <option value={String(t.value)} key={t.value}>{t.label}</option>
                ))}
              </select>
            </Stack>

            <Stack className="price-year-after-price">
              <Typography className="title">Seats</Typography>
              <select
                className="select-description"
                value={insertPropertyData.propertyBeds ? String(insertPropertyData.propertyBeds) : "select"}
                onChange={({ target: { value } }) =>
                  setInsertPropertyData({
                    ...insertPropertyData,
                    propertyBeds: value === "select" ? 0 : parseInt(value, 10),
                  })
                }
              >
                <option disabled value="select">Select</option>
                {[2, 4, 5, 7, 8].map((bed) => (
                  <option value={String(bed)} key={bed}>{bed}</option>
                ))}
              </select>
            </Stack>

            <Stack className="price-year-after-price">
              <Typography className="title">Mileage (km)</Typography>
              <input
                type="number"
                className="description-input"
                placeholder="e.g. 120000"
                min={0}
                max={2000000}
                step={1}
                value={insertPropertyData.propertySquare === 0 ? "" : String(insertPropertyData.propertySquare)}
                onChange={({ target: { value } }) => {
                  const num = value === "" ? 0 : Math.max(0, Math.min(2000000, parseInt(value, 10) || 0));
                  setInsertPropertyData({ ...insertPropertyData, propertySquare: num });
                }}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
              />
              <Typography sx={{ fontSize: "12px", opacity: 0.7, mt: "6px" }}>
                Example: 85000, 120000, 235000
              </Typography>
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
            />
          </Stack>
        </Stack>

        {/* UPLOAD */}
        <div className="upload-head">
          <div>
            <Typography className="upload-title">Upload photos</Typography>
            <Typography className="upload-subtitle">
              Add up to {MAX_IMAGES} images. Best: JPG/PNG, high quality.
            </Typography>
          </div>

          <div className="upload-counter">
            <span className="count">{currentImages}</span>
            <span className="slash">/</span>
            <span className="max">{MAX_IMAGES}</span>
          </div>
        </div>

        <Stack className="images-box">
          <div
            className="upload-box"
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!e.dataTransfer?.files?.length) return;
              await uploadImages(e.dataTransfer.files);
            }}
            role="button"
            tabIndex={0}
            onClick={openFilePicker}
          >
            <div className="upload-icon">+</div>
            <div className="text-box">
              <Typography className="drag-title">Drag & drop images</Typography>
              <Typography className="format-title">
                Click to browse. You can upload multiple images (max {MAX_IMAGES}).
              </Typography>
            </div>

            <Button
              className="browse-button"
              onClick={(e: { stopPropagation: () => void; }) => {
                e.stopPropagation();
                openFilePicker();
              }}
            >
              <Typography className="browse-button-text">Browse Files</Typography>
            </Button>

            <input
              ref={inputRef}
              type="file"
              hidden
              multiple
              accept="image/jpg, image/jpeg, image/png"
              onChange={(e) => uploadImages(e.target.files as any)}
            />
          </div>

          <Stack className="gallery-box">
            {(insertPropertyData?.propertyImages || []).map((image: string) => {
              const imagePath = image.startsWith("http") ? image : joinUrl(REACT_APP_API_URL as any, image);
              return (
                <div className="image-box" key={image}>
                  <img src={imagePath} alt="" />
                  <button type="button" className="remove-btn" onClick={() => removeImage(image)}>✕</button>
                </div>
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
    propertyRentPeriod: PropertyRentPeriod.MONTHLY,
    propertyRooms: 0,
    propertyBeds: 0,
    propertySquare: 0,
    propertyDesc: "",
    propertyImages: [],
  },
};

export default AddProperty;
