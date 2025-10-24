import axios from "axios"
const Port = 5030
const BaseUrl = `http://localhost:${Port}`
const Client = axios.create({
    baseURL: BaseUrl,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 5000,
})

Client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default Client;