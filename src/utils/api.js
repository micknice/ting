const axios = require("axios");

const URL = "https://www.few-far.co/api/techtest/v1/";

const getSupporters = async() => {
  console.log("getSupporters API invoked");
  return axios.get(`${URL}supporters`).then(({ data }) => {
    const supporters = data.data
    return supporters;
  });
};

const getDonationsLength = async() => {
  return axios.get(`${URL}donations?page=1`).then(({ data }) => {
    return data.total;
  });
};

const requestExportData = async () => {
  return axios.post(`${URL}donations_exports`).then(({ data }) => {
    return data.url;
  });
};

const retrieveExportDataByUrl = async(url) => {
  return axios.get(url).then(async({ data }) => {
    if (data.status === "pending") {
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      console.log("Not ready", data);
      await delay(10000);
      return retrieveExportDataByUrl(url);
    } else {
      const donations = data.data
      return donations;
    }
  });
};

module.exports = {
  getSupporters,
  getDonationsLength,
  requestExportData,
  retrieveExportDataByUrl,
};
