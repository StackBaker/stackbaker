// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::collections::HashMap;
use std::env;

const SCOPES: &str = "https://www.googleapis.com/auth/calendar.events";
const CLIENT_ID: &str = env!("CLIENT_ID", "client ID not set");
const CLIENT_SECRET: &str = env!("CLIENT_SECRET", "client secret not set");
const AUTHORIZATION_ENDPOINT: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const REDIRECT_URI: &str = "urn:ietf:wg:oauth:2.0:oob";

#[tauri::command]
fn create_oauth_request_url() -> String {
    let mut params = HashMap::new();
    params.insert("client_id", CLIENT_ID);
    params.insert("redirect_uri", REDIRECT_URI);
    params.insert("scope", SCOPES);

    // response type is code for desktop applications
    params.insert("response_type", "code");

    let query_string = serde_urlencoded::to_string(params).unwrap();
    format!("{}?{}", AUTHORIZATION_ENDPOINT, query_string)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![create_oauth_request_url])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
