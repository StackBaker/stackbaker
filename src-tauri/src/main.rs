// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::collections::HashMap;
use std::env;

const AUTH_URI: &str = "https://accounts.google.com/o/oauth2/auth";
const TOKEN_URI: &str = "https://oauth2.googleapis.com/token";

const SCOPES: &str = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email";
const CLIENT_ID: &str = env!("GOOGLE_CLIENT_ID", "client ID not set");
const CLIENT_SECRET: &str = env!("GOOGLE_CLIENT_SECRET", "client secret not set");
const REDIRECT_URI: &str = "urn:ietf:wg:oauth:2.0:oob";

#[tauri::command]
fn create_oauth_request_url() -> String {
    let mut params: HashMap<&str, &str> = HashMap::new();
    params.insert("client_id", CLIENT_ID);
    params.insert("redirect_uri", REDIRECT_URI);
    params.insert("scope", SCOPES);

    // response type is code for desktop applications
    params.insert("response_type", "code");

    let query_string = serde_urlencoded::to_string(params).unwrap();
    format!("{}?{}", AUTH_URI, query_string)
}

#[tauri::command]
fn exchange_code_for_tokens(authorization_code: String) -> serde_json::Value {
    let authorization_code: &str = authorization_code.as_str();
    let mut params: HashMap<&str, &str> = HashMap::new();

    params.insert("grant_type", "authorization_code");
    params.insert("code", authorization_code);
    params.insert("client_id", CLIENT_ID);
    params.insert("client_secret", CLIENT_SECRET);
    params.insert("redirect_uri", REDIRECT_URI);

    let client = reqwest::blocking::Client::new();
    let response = client.post(TOKEN_URI)
        .form(&params)
        .send()
        .unwrap();

    let response_body: String = response.text().unwrap();
    let response_body: &str = response_body.as_str();
    let response_json: serde_json::Value = serde_json::from_str(&response_body).unwrap();
    let access_token = response_json.get("access_token");
    let refresh_token = response_json.get("refresh_token");
    let expires_in = response_json.get("expires_in");

    let access_token: serde_json::Value = match access_token {
        Some(x) => x.clone(),
        None => serde_json::json!(null)
    };

    let refresh_token: serde_json::Value = match refresh_token {
        Some(x) => x.clone(),
        None => serde_json::json!(null)
    };

    let expires_in: serde_json::Value = match expires_in {
        Some(x) => x.clone(),
        None => serde_json::json!(null)
    };

    let output = serde_json::json!({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": expires_in
    });

    return output;
}

// create a function to retrieve the user email

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![create_oauth_request_url, exchange_code_for_tokens])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
