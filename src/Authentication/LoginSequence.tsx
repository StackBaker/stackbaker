import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api";
import { open } from "@tauri-apps/api/shell";
import { Text, Title, Group, Stack, Button, TextInput } from "@mantine/core";
import { Google } from "@mui/icons-material";

type loginStage = 0 | 1 | 2;

interface LoginProps {

};

const LoginSequence = function(props: LoginProps) {
	const [oauthURL, setOAuthUrl] = useState("");
    const [loginStage, setLoginStage] = useState<loginStage>(0); // debugging

	useEffect(() => {
		invoke("create_oauth_request_url").then((r) => {
			let res = r as string;
			setOAuthUrl(res);
			console.log("Auth URL:", res);
		});
	}, []);

    const Welcome = (
        <>
            <Title>Welcome to StackBaker</Title>
            <Button
                onClick={() => {
                    open(oauthURL).then();
                    setLoginStage(1);
                }}
                leftIcon={<Google />}
            >
                Login with Google
            </Button>
        </>
    );

    // accept an authorization code
    // need: email -- why? Canvas?
    // send a verification email
    // then try to connect Google after that
    // so: accept an email and a password?
    // *then* try to connect google?
    // First TODO: explore the oauth thing
    // if the authorization code has information about the email
    // then we may not need the

    // Maybe:
    // Don't have an account: Sign up page
    // Else: sign in page?
    // first: figure out what to do with the auth codes

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const target = e.target as HTMLFormElement;
        const inputEl = target[0] as HTMLInputElement;
        const authcode = inputEl.value;

        console.log(authcode);

        invoke("exchange_code_for_tokens", { authorizationCode: authcode }).then()
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
                    <Button onClick={() => setLoginStage(0)} variant="outline">
                        Back
                    </Button>
                    <Button type="submit">
                        Submit
                    </Button>
                </Group>
            </form>
        </>
    );

    // Error stage: Display Error and button to return to first login page

    const stages = [Welcome, AcceptCode];

    return (
        <Group miw="100vw" mih="100vh" position="center">
            <Stack pb="10vh" align="center">
                {stages[loginStage]}
            </Stack>
        </Group>
    );
}

export default LoginSequence;
