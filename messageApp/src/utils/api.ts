import axios from "@/utils/axios.customize";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const registerAPI = (data: {
    email: string,
    password: string,
    first_name: string,
    last_name: string,
    user_name: string
}) => {
    const url = `/api/auth/register`;
    return axios.post<IBackendRes<IRegister>>(url, data);
}

export const loginAPI = (email_or_username: string, password: string) => {
    const url = `/api/auth/login`;
    return axios.post<IUserLogin>(url, { user_name: email_or_username, password });
}

// 1. API yêu cầu gửi mã OTP
export const requestPasswordResetAPI = (email: string) => {
    const url = `/api/auth/forgot-password`;
    return axios.post<IBackendRes<{ otp?: string }>>(url, { email });
}

// 2. API xác thực mã OTP, trả về resetToken
export const verifyOtpAPI = (email: string, otp: string) => {
    const url = `/api/auth/verify-otp`;
    return axios.post<IBackendRes<IVerifyOtpRes>>(url, { email, otp });
}

// 3. API đặt lại mật khẩu mới, dùng resetToken
export const resetPasswordAPI = (token: string, new_password: string) => {
    const url = `/api/auth/reset-password`;
    return axios.post<IBackendRes<any>>(url, { token, new_password });
}

// export const verifyCodeAPI = (email: string, code: string) => {
//     const url = `/api/v1/auth/verify-code`;
//     return axios.post<IBackendRes<IRegister>>(url, { email, code });
// }

// export const resendCodeAPI = (email: string) => {
//     const url = `/api/v1/auth/verify-email`;
//     return axios.post<IBackendRes<IRegister>>(url, { email });
// }

// export const loginAPI = (email: string, password: string) => {
//     const url = `/api/v1/auth/login`;
//     return axios.post<IBackendRes<IUserLogin>>(url, { username: email, password });
// }

// export const getAccountAPI = () => {
//     const url = `/api/v1/auth/account`;
//     return axios.get<IBackendRes<IUserLogin>>(url);
// }

// export const getTopRestaurants = (ref: string) => {
//     const url = `/api/v1/restaurants/${ref}`;
//     return axios.post<IBackendRes<ITopRestaurant[]>>(url, {}, {
//         headers: { delay: 1000 }
//     });
// }

// export const getRestaurantByIdAPI = (id: string) => {
//     const url = `/api/v1/restaurants/${id}`;
//     return axios.get<IBackendRes<IRestaurants>>(url, {
//         headers: { delay: 300 }
//     });
// }

// export const getUrlBaseBackend = () => {
//     const backend = Platform.OS === "android"
//         ? process.env.EXPO_PUBLIC_ANDROID_API_URL
//         : process.env.EXPO_PUBLIC_IOS_API_URL;
//     return backend;
// }

// export const processDataRestaurantMenu = (restaurant: IRestaurants | null) => {
//     if (!restaurant) return [];
//     return restaurant?.menu?.map((menu, index) => {
//         return {
//             index,
//             key: menu._id,
//             title: menu.title,
//             data: menu.menuItem
//         }
//     })
// }

// export const placeOrderAPI = (data: any) => {
//     const url = `/api/v1/orders`;
//     return axios.post<IBackendRes<IUserLogin>>(url, { ...data });
// }

// export const getOrderHistoryAPI = () => {
//     const url = `/api/v1/orders`;
//     return axios.get<IBackendRes<IOrderHistory[]>>(url);
// }

// export const updateUserAPI = (_id: string, name: string, phone: string) => {
//     const url = `/api/v1/users`;
//     return axios.patch<IBackendRes<IUserLogin>>(url, { _id, name, phone });
// }

// export const updateUserPasswordAPI = (
//     currentPassword: string,
//     newPassword: string,
// ) => {
//     const url = `/api/v1/users/password`;
//     return axios.post<IBackendRes<IUserLogin>>(url, { currentPassword, newPassword });
// }

// export const requestPasswordAPI = (email: string) => {
//     const url = `/api/v1/auth/retry-password`;
//     return axios.post<IBackendRes<IUserLogin>>(url, { email });
// }

// export const forgotPasswordAPI = (code: string, email: string, password: string) => {
//     const url = `/api/v1/auth/forgot-password`;
//     return axios.post<IBackendRes<IUserLogin>>(url, { code, email, password });
// }

// export const likeRestaurantAPI = (restaurant: string, quantity: number) => {
//     const url = `/api/v1/likes`;
//     return axios.post<IBackendRes<IUserLogin>>(url, { restaurant, quantity });
// }

// export const getFavoriteRestaurantAPI = () => {
//     const url = `/api/v1/likes?current=1&pageSize=10`;
//     return axios.get<IBackendRes<IRestaurants[]>>(url);
// }

// export const currencyFormatter = (value: any) => {
//     const options = {
//         significantDigits: 2,
//         thousandsSeparator: '.',
//         decimalSeparator: ',',
//         symbol: 'đ'
//     }

//     if (typeof value !== 'number') value = 0.0
//     value = value.toFixed(options.significantDigits)

//     const [currency, decimal] = value.split('.')
//     return `${currency.replace(
//         /\B(?=(\d{3})+(?!\d))/g,
//         options.thousandsSeparator
//     )} ${options.symbol}`
// }

// export const printAsyncStorage = () => {
//     AsyncStorage.getAllKeys((err, keys) => {
//         AsyncStorage.multiGet(keys!, (error, stores) => {
//             let asyncStorage: any = {}
//             stores?.map((result, i, store) => {
//                 asyncStorage[store[i][0]] = store[i][1]
//             });
//             console.log(JSON.stringify(asyncStorage, null, 2));
//         });
//     });
// };

// export const getRestaurantByNameAPI = (name: string) => {
//     const url = `/api/v1/restaurants?current=1&pageSize=10&name=/${name}/i`;
//     return axios.get<IBackendRes<IModelPaginate<IRestaurants>>>(url);
// };

// export const filterRestaurantAPI = (query: string) => {
//     const url = `/api/v1/restaurants?${query}`;
//     return axios.get<IBackendRes<IModelPaginate<IRestaurants>>>(url);
// }