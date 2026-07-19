import { LoginResponse } from "./useLogin.d";

interface LoginDto {
    username: string;
    password: string;
    otpCode?: string;
    captchaToken: string;
}

export function useLogin() {
    const login = (dto: LoginDto) => new Promise<LoginResponse>((resolve, reject) => window.fetch2.post("/api/auth/login", dto)
        .then((res: LoginResponse) => {
            localStorage.setItem("token", res.data.token);

            window.fetch2.get("/api/users/me").then((res: Fetch2Response) => {
                resolve(res);
            })
                .catch(reject);
        })
        .catch(reject));

    return { login };
}
