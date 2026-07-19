import { AuthAuthEntity } from "@blacket/types";

interface RegisterDto {
    username: string;
    password: string;
    captchaToken: string;
}

export function useRegister() {
    const register = (dto: RegisterDto) => new Promise((resolve, reject) => window.fetch2.post("/api/auth/register", dto)
        .then((res: Fetch2Response & { data: AuthAuthEntity }) => {
            localStorage.setItem("token", res.data.token);

            window.fetch2.get("/api/users/me").then((res: Fetch2Response) => {
                resolve(res);
            })
                .catch(reject);
        })
        .catch(reject));

    return { register };
}
