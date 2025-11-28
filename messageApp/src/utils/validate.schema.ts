import * as Yup from 'yup';
export const LoginSchema = Yup.object().shape({
    password: Yup.string()
        .min(6, 'Password cần tối thiểu 6 kí tự')
        .max(50, 'Password tối đa 50 kí tự')
        .required('Password không được để trống'),
    email: Yup.string()
        .email('Định dạng email không hợp lệ')
        .required('Email không được để trống'),
});

export const SignUpSchema = Yup.object().shape({
    firstName: Yup.string()
        .required('Họ không được để trống'),
    lastName: Yup.string()
        .required('Tên không được để trống'),
    password: Yup.string()
        .min(6, 'Password cần tối thiểu 6 kí tự')
        .max(50, 'Password tối đa 50 kí tự')
        .required('Password không được để trống'),
    confirmPassword: Yup.string()
        .required('Bạn cần xác thực lại mật khẩu')
        .oneOf([Yup.ref('password')], 'Mật khẩu không khớp'),
    email: Yup.string()
        .email('Định dạng email không hợp lệ')
        .required('Email không được để trống'),
    dob: Yup.date()
        .required('Ngày sinh không được để trống')
        .max(new Date(), "Ngày sinh không hợp lệ")
});

export const UpdateUserSchema = Yup.object().shape({
    name: Yup.string()
        .required('Họ tên không được để trống'),
    phone: Yup.string()
        .required('Số điện thoại không được để trống')
});

export const UpdateUserPasswordSchema = Yup.object().shape({
    currentPassword: Yup.string()
        .min(6, 'mật khẩu hiện tại cần tối thiểu 6 ký tự')
        .max(50, 'mật khẩu hiện tại tối đa 50 ký tự')
        .required('mật khẩu hiện tại không được để trống'),
    newPassword: Yup.string()
        .min(6, 'mật khẩu mới cần tối thiểu 6 ký tự')
        .max(50, 'mật khẩu mới tối đa 50 ký tự')
        .required('mật khẩu mới không được để trống'),

    confirmNewPassword: Yup.string()
        .required('không được để trống')
        .oneOf([Yup.ref('newPassword')], 'mật khẩu mới không đúng'),

});

export const RequestPasswordSchema = Yup.object().shape({
    email: Yup.string()
        .email('Định dạng email không hợp lệ')
        .required('Email không được để trống'),
});

export const ForgotPasswordSchema = Yup.object().shape({
    password: Yup.string()
        .min(6, 'Password cần tối thiểu 6 ký tự')
        .max(50, 'Password tối đa 50 ký tự')
        .required('Password không được để trống'),
    confirmPassword: Yup.string()
        .required('confirmPassword không được để trống')
        .oneOf([Yup.ref('password')], 'Passwords must match'),
    code: Yup.string()
        .required('Code không được để trống'),
});