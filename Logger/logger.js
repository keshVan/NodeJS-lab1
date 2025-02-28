const axios = require("axios");

const offset = new Date().getTimezoneOffset() * 60000; //смещение времени в локальное

//Middleware для логирования
const logger = (service) => {
    return (req, res, next) => {
        const start = Date.now() - offset;

        res.on("finish", () => {
            const end = Date.now() - offset;
            axios.post("http://localhost:3002/log", {
                service: service,
                start: new Date(start).toISOString(),
                method: req.method,
                url: req.url,
                end: new Date(end).toISOString()
            });
        });
        
        next(); 
    }
}
module.exports = logger;