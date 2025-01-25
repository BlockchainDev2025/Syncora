 const port = process.env.PORT || 4000
 export default {
     "open_api_version": "3.0.3",
     "title": "Test syncora code",
     "version": "1.0.0",
     "description": "Syncora backend code",
     "url": "https://localhost:" + port,
     "apis": ["./routes/v1/*.js"]
 }