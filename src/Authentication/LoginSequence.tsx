import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api";
import { open } from "@tauri-apps/api/shell";
import { Text, Title, Group, Stack, Button, TextInput } from "@mantine/core";
import { Google } from "@mui/icons-material";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import useUserDB from "../Persistence/useUserDB";
import * as paths from "../paths";

// 2: error
type loginStage = 0 | 1;

interface LoginProps {

};

const LoginSequence = function(props: LoginProps) {
	const [oauthURL, setOAuthUrl] = useState("");
    const [loginStage, setLoginStage] = useState<loginStage>(0);

    const udb = useUserDB();
    const navigate = useNavigate();

    useEffect(() => {
        udb.load();
    }, []);

    useEffect(() => {
		invoke("create_oauth_request_url").then((r) => {
			let res = r as string;
			setOAuthUrl(res);
			console.log("Auth URL:", res);
		});
	}, []);


    // accept an authorization code
    // need: email -- why? Canvas?
    // send a verification email
    // then try to connect Google after that
    // so: accept an email and a password?
    // *then* try to connect google?
    // First TODO: explore the oauth thing
    // the access token does not have information about the email
    // in terms of encryption it would be better to have email password authentication

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const target = e.target as HTMLFormElement;
        const inputEl = target[0] as HTMLInputElement;
        const authcode = inputEl.value;

        invoke("exchange_code_for_tokens", { authorizationCode: authcode }).then(
            (r) => {
                let res = r as { expires_in: number, access_token: string, refresh_token: string };
                // using the access token, retrieve the user email
                const accessToken = res.access_token;
                const refreshToken = res.refresh_token;
                const expiryDate = dayjs().add(Math.max(res.expires_in - 10, 0), "seconds").format();

                if (!accessToken || !refreshToken || !expiryDate) {
                    setLoginStage(1);
                    return;
                }

                udb.set("authData", {
                    accessToken,
                    refreshToken,
                    expiryDate
                });

                navigate(paths.ROOT_PATH);
            }
        )
    }

    const AcceptCode = (
        <>
            <Title order={2}>Enter your Authorization Code</Title>
            <Text maw="35vw" align="center">
                You should have received an authorization code after going through
                Google's OAuth sequence. Paste it in the text box below.
            </Text>
            <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                <TextInput
                    py="md"
                    placeholder="Auth code"
                />
                <Group position="apart" w="100%">
                    <Button onClick={() => navigate(paths.DASHBOARD_PATH)} variant="outline">
                        Back
                    </Button>
                    <Button onClick={() => open(oauthURL)} variant="subtle" opacity={0.5}>
                        Restart Google OAuth sequence
                    </Button>
                    <Button type="submit">
                        Submit
                    </Button>
                </Group>
            </form>
        </>
    );

    // Error stage: Display Error and button to return to first login page
    const Error = (
        <>
            <Title>Something went wrong...</Title>
            <Text maw="35vw">Return to the previous page to try again.</Text>
            <Group position="apart">
                <Button onClick={() => {
                    setLoginStage(0);
                }}>Return</Button>
            </Group>
        </>
    );

    const stages = [AcceptCode, Error];

    return (
        <Group miw="100vw" mih="100vh" position="center">
            <Stack pb="10vh" align="center">
                {stages.at(loginStage)}
            </Stack>
        </Group>
    );
}

export default LoginSequence;
