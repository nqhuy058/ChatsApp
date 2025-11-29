import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Định nghĩa kiểu dữ liệu cho user và context
// (Bạn có thể tạo một file types.ts để định nghĩa IUser chi tiết hơn)
interface IUser {
    _id: string;
    user_name: string;
    display_name: string;
    avatarURL?: string;
}

interface AuthContextType {
    token: string | null;
    user: IUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: { accessToken: string, user: IUser }) => Promise<void>;
    logout: () => Promise<void>;
}

// Tạo Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Tạo Provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<IUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Tự động load token và user từ storage khi app khởi động
        const loadAuthData = async () => {
            try {
                const storedToken = await AsyncStorage.getItem('access_token');
                const storedUser = await AsyncStorage.getItem('user_info');

                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                }
            } catch (e) {
                console.error("Lỗi khi load dữ liệu xác thực:", e);
            } finally {
                setIsLoading(false);
            }
        };

        loadAuthData();
    }, []);

    const login = async (data: { accessToken: string, user: IUser }) => {

        setToken(data.accessToken);
        setUser(data.user);
        await AsyncStorage.setItem('access_token', data.accessToken);
        await AsyncStorage.setItem('user_info', JSON.stringify(data.user));
    };

    const logout = async () => {
        setToken(null);
        setUser(null);
        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('user_info');
    };

    const value = {
        token,
        user,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Tạo custom hook để dễ dàng sử dụng context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};