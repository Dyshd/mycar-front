import React, { useCallback, useEffect, useMemo, useState } from "react";
import { NextPage } from "next";
import useDeviceDetect from "../../hooks/useDeviceDetect";
import { Button, Stack, Typography } from "@mui/material";
import axios from "axios";
import { Messages, REACT_APP_API_URL } from "../../config";
import { getJwtToken, updateStorage, updateUserInfo } from "../../auth";
import { useMutation, useReactiveVar } from "@apollo/client";
import { userVar } from "../../../apollo/store";
import { MemberUpdate } from "../../types/member/member.update";
import { UPDATE_MEMBER } from "../../../apollo/user/mutation";
import { sweetErrorHandling, sweetMixinSuccessAlert, sweetMixinErrorAlert } from "../../sweetAlert";

const MyProfile: NextPage = ({ initialValues }: any) => {
  const device = useDeviceDetect();
  const token = getJwtToken();
  const user = useReactiveVar(userVar);
  const [updateData, setUpdateData] = useState<MemberUpdate>(initialValues);
  const [uploading, setUploading] = useState(false);

  /** APOLLO REQUESTS **/
  const [updateMember] = useMutation(UPDATE_MEMBER);

  /** HELPERS **/
  const getImageUrl = useCallback((path?: string) => {
    if (!path) return "/img/profile/defaultUser.svg";
    if (path.startsWith("http")) return path;
    if (path.startsWith("/")) return `${REACT_APP_API_URL}${path}`;
    return `${REACT_APP_API_URL}/${path}`;
  }, []);

  const previewImage = useMemo(() => getImageUrl(updateData?.memberImage), [updateData?.memberImage, getImageUrl]);

  /** LIFECYCLES **/
  useEffect(() => {
    setUpdateData({
      ...updateData,
      memberNick: user.memberNick || "",
      memberPhone: user.memberPhone || "",
      memberAddress: user.memberAddress || "",
      memberImage: user.memberImage || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /** HANDLERS **/
  const uploadImage = async (e: any) => {
    try {
      const image: File | undefined = e.target.files?.[0];
      if (!image) return;

      // reset input so same file can be re-selected
      e.target.value = "";

      // simple validations
      const allowed = ["image/jpg", "image/jpeg", "image/png"];
      if (!allowed.includes(image.type)) throw new Error("Only JPG, JPEG, PNG allowed!");
      if (image.size > 6 * 1024 * 1024) throw new Error("Image too large! Max 6MB.");

      setUploading(true);

      const formData = new FormData();
      formData.append(
        "operations",
        JSON.stringify({
          query: `mutation ImageUploader($file: Upload!, $target: String!) {
            imageUploader(file: $file, target: $target)
          }`,
          variables: {
            file: null,
            target: "member",
          },
        })
      );

      formData.append(
        "map",
        JSON.stringify({
          "0": ["variables.file"],
        })
      );

      formData.append("0", image);

      const response = await axios.post(`${process.env.REACT_APP_API_GRAPHQL_URL}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "apollo-require-preflight": true,
          Authorization: `Bearer ${token}`,
        },
      });

      const responseImage = response?.data?.data?.imageUploader;
      if (!responseImage) throw new Error("Upload failed!");

      setUpdateData((prev) => ({ ...prev, memberImage: responseImage }));
      await sweetMixinSuccessAlert("Image uploaded!");
    } catch (err: any) {
      console.log("Error, uploadImage:", err?.message);
      await sweetMixinErrorAlert(err?.message || "Upload error");
    } finally {
      setUploading(false);
    }
  };

  const updateProfileHandler = useCallback(async () => {
    try {
      if (!user._id) throw new Error(Messages.error2);

      const payload: any = { ...updateData, _id: user._id };

      const result = await updateMember({
        variables: { input: payload },
      });

      const jwtToken = result?.data?.updateMember?.accessToken;
      if (jwtToken) {
        await updateStorage({ jwtToken });
        updateUserInfo(jwtToken);
      }

      await sweetMixinSuccessAlert("Information updated successfully");
    } catch (err: any) {
      sweetErrorHandling(err).then();
    }
  }, [updateData, user, updateMember]);

  const doDisabledCheck = () => {
    return (
      !updateData.memberNick ||
      !updateData.memberPhone ||
      !updateData.memberAddress ||
      !updateData.memberImage ||
      uploading
    );
  };

  if (device === "mobile") return <>MY PROFILE PAGE MOBILE</>;

  return (
    <div id="my-profile-page">
      <Stack className="main-title-box">
        <Stack className="right-box">
          <Typography className="main-title">My Profile</Typography>
          <Typography className="sub-title">Manage your account details and profile photo.</Typography>
        </Stack>

        <Stack className="profile-actions">
          <Button className="ghost-btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <Typography>Top</Typography>
          </Button>
        </Stack>
      </Stack>

      <Stack className="top-box">
        {/* PHOTO */}
        <Stack className="photo-box">
          <Typography className="title">Photo</Typography>

          <Stack className="image-big-box">
            <Stack className="image-box">
              <img src={previewImage} alt="profile" />
              {uploading ? (
                <div className="img-loading">
                  <span />
                  <Typography>Uploading...</Typography>
                </div>
              ) : null}
            </Stack>

            <Stack className="upload-big-box">
              <input
                type="file"
                hidden
                id="hidden-input"
                onChange={uploadImage}
                accept="image/jpg, image/jpeg, image/png"
              />

              <label htmlFor="hidden-input" className={`labeler ${uploading ? "disabled" : ""}`}>
                <Typography>{uploading ? "Uploading..." : "Upload Profile Image"}</Typography>
              </label>

              <Typography className="upload-text">JPG / JPEG / PNG. Max 6MB.</Typography>
            </Stack>
          </Stack>
        </Stack>

        {/* INPUTS */}
        <Stack className="small-input-box">
          <Stack className="input-box">
            <Typography className="title">Username</Typography>
            <input
              type="text"
              placeholder="Your username"
              value={updateData.memberNick}
              onChange={({ target: { value } }) => setUpdateData({ ...updateData, memberNick: value })}
            />
          </Stack>

          <Stack className="input-box">
            <Typography className="title">Phone</Typography>
            <input
              type="text"
              placeholder="Your phone"
              value={updateData.memberPhone}
              onChange={({ target: { value } }) => setUpdateData({ ...updateData, memberPhone: value })}
            />
          </Stack>
        </Stack>

        <Stack className="address-box">
          <Typography className="title">Address</Typography>
          <input
            type="text"
            placeholder="Your address"
            value={updateData.memberAddress}
            onChange={({ target: { value } }) => setUpdateData({ ...updateData, memberAddress: value })}
          />
        </Stack>

        {/* BUTTON */}
        <Stack className="about-me-box">
          <Button className="update-button" onClick={updateProfileHandler} disabled={doDisabledCheck()}>
            <Typography>Update Profile</Typography>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
              <g clipPath="url(#clip0_7065_6985)">
                <path
                  d="M12.6389 0H4.69446C4.49486 0 4.33334 0.161518 4.33334 0.361122C4.33334 0.560727 4.49486 0.722245 4.69446 0.722245H11.7672L0.105803 12.3836C-0.0352676 12.5247 -0.0352676 12.7532 0.105803 12.8942C0.176321 12.9647 0.268743 13 0.361131 13C0.453519 13 0.545907 12.9647 0.616459 12.8942L12.2778 1.23287V8.30558C12.2778 8.50518 12.4393 8.6667 12.6389 8.6667C12.8385 8.6667 13 8.50518 13 8.30558V0.361122C13 0.161518 12.8385 0 12.6389 0Z"
                  fill="white"
                />
              </g>
              <defs>
                <clipPath id="clip0_7065_6985">
                  <rect width="13" height="13" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </Button>
        </Stack>
      </Stack>
    </div>
  );
};

MyProfile.defaultProps = {
  initialValues: {
    _id: "",
    memberImage: "",
    memberNick: "",
    memberPhone: "",
    memberAddress: "",
  },
};

export default MyProfile;
