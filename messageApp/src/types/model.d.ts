export { };

declare global {
    // Cấu trúc chung cho response từ backend
    interface IBackendRes<T> {
        accessToken: IBackendRes<IUserLogin>;
        error?: string | string[];
        message: string | string[] | any; // Sửa `any` để khớp với BE
        statusCode: number | string;
        data?: T;
    }

    // Kiểu dữ liệu cho người dùng
    interface IUser {
        _id: string;
        user_name: string;
        email: string;
        first_name: string;
        last_name: string;
        avatar?: string;
    }

    // Kiểu dữ liệu trả về khi đăng ký thành công
    interface IRegister {
        user: IUser;
    }

    // Kiểu dữ liệu trả về khi đăng nhập thành công
    interface IUserLogin {
        message: string;
        accessToken: string; // Sửa tên trường thành camelCase
        user: IUser;
    }

    interface IVerifyOtpRes {
        message: string;
        resetToken: string;
    }
}