"use strict";
// Developped by QuozGaming
// https://www.quozpowa.com
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var _a = require('f1-telemetry-client'), F1TelemetryClient = _a.F1TelemetryClient, constants = _a.constants;
var PACKETS = constants.PACKETS, SESSION_TYPES = constants.SESSION_TYPES, TEAMS = constants.TEAMS, SAFETY_CAR_STATUSES = constants.SAFETY_CAR_STATUSES, TYRES = constants.TYRES;
var client = new F1TelemetryClient();
var sessionData = { "sessionType": "", "m_sessionTimeLeft": 0, "m_safetyCarStatus": 0, "totalLaps": 0 };
var session = '';
var yellow_flag;
var express = require('express');
var app = express();
app.set('view engine', 'ejs');
var participants_data = [];
app.get('/', function (req, res) {
    res.render(__dirname + "/classement.ejs");
});
app.get('/data', function (req, res) {
    var result = participants_data.slice();
    var result_final = [];
    for (var _i = 0, _a = Object.entries(result); _i < _a.length; _i++) {
        var _b = _a[_i], i = _b[0], res_1 = _b[1];
        res_1.m_lastLapTime = best_times[i];
        if (res_1.m_carPosition) {
            result_final.push(res_1);
        }
    }
    result_final.sort(keysrt('m_carPosition'));
    for (var _c = 0, _d = Object.entries(result_final); _c < _d.length; _c++) {
        var _e = _d[_c], i = _e[0], res_2 = _e[1];
        var index_i = parseInt(i);
        if (index_i == 0) {
            if (session === 'R') {
                res_2.info = "L" + res_2.m_currentLapNum;
            }
            else {
                if (res_2.m_lastLapTime) {
                    res_2.info = fmtMSS(res_2.m_lastLapTime);
                }
            }
        }
        if (index_i > 0) {
            if (session === 'R') {
                if (res_2.m_resultStatus === 4) {
                    res_2.info = 'DSQ';
                }
                else if (res_2.m_resultStatus === 6) {
                    res_2.info = 'DNF';
                }
                else if (result_final[0].m_currentLapNum - res_2.m_currentLapNum > 1) {
                    res_2.info = '+' + (result_final[0].m_currentLapNum - res_2.m_currentLapNum) + ' L';
                }
                else {
                    res_2.gap = ((result_final[index_i - 1].m_totalDistance - result_final[index_i].m_totalDistance) / 63).toFixed(3);
                    res_2.info = '+' + res_2.gap + ' s';
                }
            }
            else {
                if (result_final[0].m_lastLapTime && result_final[index_i].m_lastLapTime) {
                    res_2.gap = (parseFloat(result_final[index_i].m_lastLapTime) - parseFloat(result_final[0].m_lastLapTime)).toFixed(3);
                    res_2.info = '+' + res_2.gap + ' s';
                }
            }
        }
    }
    var totalSeconds = sessionData.m_sessionTimeLeft;
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    var m_sessionTimeLeft = minutes + ':' + seconds;
    var sc_status = SAFETY_CAR_STATUSES[sessionData.m_safetyCarStatus];
    res.json({ result: result_final, yellow_flag: yellow_flag, session: session, m_sessionTimeLeft: m_sessionTimeLeft, sc_status: sc_status, sc_status_id: sessionData.m_safetyCarStatus });
});
app.listen(3000);
var driversource_1 = require("../IntercoApp/app/driversource");
var discordcustom_1 = require("../IntercoApp/app/discordcustom");
function fmtMSS(timeInSeconds) {
    var pad = function (num, size) { return ('000' + num).slice(size * -1); };
    var time = parseFloat(timeInSeconds.toFixed(3));
    var minutes = Math.floor(time / 60) % 60;
    var seconds = Math.floor(time - minutes * 60);
    var time_toString = time.toString();
    var milliseconds = time_toString.slice(-3);
    return pad(minutes, 2) + ':' + pad(seconds, 2) + ',' + pad(milliseconds, 3);
}
var discord_custom = new discordcustom_1.DiscordCustom();
var channelID = "676886528785645578";
var best_times = {};
var m_bestLapTime = 100000;
var drivers_data = {};
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var driver_source, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    driver_source = new driversource_1.DriverSource();
                    return [4 /*yield*/, driver_source.setup()];
                case 1:
                    _a.sent();
                    drivers_data = driver_source.getData();
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    console.log(e_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
main();
var participants = [];
var lapData = [];
var callEvent = function (data) {
    var i = 0;
    for (var _i = 0, lapData_1 = lapData; _i < lapData_1.length; _i++) {
        var l = lapData_1[_i];
        var myonedata = participants_data[i];
        myonedata.m_gridPosition = l.m_gridPosition + 1;
        myonedata.m_carPosition = l.m_carPosition;
        myonedata.m_penalties = l.m_penalties;
        myonedata.m_resultStatus = l.m_resultStatus;
        myonedata.m_currentLapNum = l.m_currentLapNum;
        i++;
    }
    if (data.m_eventStringCode === "SSTA") {
        best_times = {};
        m_bestLapTime = 100000;
    }
    var date = new Date();
    var result = participants_data.slice();
    if (["SEND", "CHQF", "RCWN"].includes(data.m_eventStringCode)) {
        var msgs = [];
        msgs.push('**Event : ' + data.m_eventStringCode + ' ' + date.getHours().toString().slice(-2) + 'h' + date.getMinutes().toString().slice(-2) + ' - Session ' + SESSION_TYPES[sessionData.sessionType] + ' ' + sessionData.totalLaps + ' tours**');
        result.sort(keysrt('m_carPosition'));
        for (var _a = 0, result_1 = result; _a < result_1.length; _a++) {
            var driver = result_1[_a];
            if (driver.m_carPosition) {
                msgs.push(driver.m_carPosition + '. ' + driver.m_name + ' - ' + driver.m_teamId + ' (Tour ' + driver.m_currentLapNum + ', grille ' + driver.m_gridPosition + ', pénalités ' + driver.m_penalties + 's)');
            }
        }
        discord_custom.sendMsgs(channelID, msgs);
    }
};
function keysrt(key) {
    return function (a, b) {
        if (a[key] > b[key])
            return 1;
        if (a[key] < b[key])
            return -1;
        return 0;
    };
}
client.on(PACKETS.event, callEvent);
var callSession = function (data) {
    sessionData.totalLaps = data.m_totalLaps;
    sessionData.sessionType = data.m_sessionType;
    sessionData.m_sessionTimeLeft = data.m_sessionTimeLeft;
    sessionData.m_safetyCarStatus = data.m_safetyCarStatus;
    yellow_flag = false;
    for (var _i = 0, _a = data.m_marshalZones; _i < _a.length; _i++) {
        var m = _a[_i];
        if (m.m_zoneFlag === 3) {
            yellow_flag = true;
        }
    }
    session = SESSION_TYPES[sessionData.sessionType];
};
client.on(PACKETS.session, callSession);
var setLapData = function (data) {
    if (!participants_data) {
        return;
    }
    lapData = data.m_lapData;
    var i = 0;
    for (var _i = 0, lapData_2 = lapData; _i < lapData_2.length; _i++) {
        var l = lapData_2[_i];
        if (participants_data[i]) {
            var myonedata = participants_data[i];
            myonedata.m_carPosition = l.m_carPosition;
            myonedata.m_totalDistance = l.m_totalDistance;
            myonedata.m_pitStatus = l.m_pitStatus;
            myonedata.m_driverStatus = l.m_driverStatus;
            myonedata.m_resultStatus = l.m_resultStatus;
            myonedata.m_currentLapNum = l.m_currentLapNum;
            myonedata.m_penalties = l.m_penalties;
            if (l.m_lastLapTime && (!(i in best_times) || l.m_lastLapTime < best_times[i])) {
                best_times[i] = l.m_lastLapTime;
                myonedata.m_lastLapTime = l.m_lastLapTime;
                var msgs = [];
                var best_lap = '';
                if (l.m_lastLapTime <= m_bestLapTime) {
                    best_lap = '**MEILLEUR TOUR : **';
                    m_bestLapTime = l.m_lastLapTime;
                }
                msgs.push(best_lap + participants_data[i].m_name + ' vient de PB en ' + fmtMSS(best_times[i]) + '. Il est P' + l.m_carPosition + '.');
                discord_custom.sendMsgs(channelID, msgs);
            }
        }
        i++;
    }
};
var setCarStatus = function (data) {
    var i = 0;
    for (var _i = 0, _a = data.m_carStatusData; _i < _a.length; _i++) {
        var c = _a[_i];
        if (participants_data[i]) {
            var myonedata = participants_data[i];
            var m_tyresWear = c.m_tyresWear.toString().split(',');
            var usure = 0;
            for (var _b = 0, m_tyresWear_1 = m_tyresWear; _b < m_tyresWear_1.length; _b++) {
                var tyresWear = m_tyresWear_1[_b];
                usure = usure + parseInt(tyresWear);
            }
            myonedata.m_tyresWear = usure / 4;
            if (c.m_tyreVisualCompound && c.m_tyreVisualCompound !== 255) {
                var tyre_name = TYRES[c.m_tyreVisualCompound].name.slice(0, 1);
                if (TYRES[c.m_tyreVisualCompound].name === 'C5') {
                    tyre_name = 'S';
                }
                else if (TYRES[c.m_tyreVisualCompound].name === 'C4') {
                    tyre_name = 'M';
                }
                else if (TYRES[c.m_tyreVisualCompound].name === 'C3') {
                    tyre_name = 'H';
                }
                myonedata.m_actualTyreCompound = tyre_name;
            }
        }
        i++;
    }
};
var setParticipants = function (data) {
    participants = data.m_participants;
    participants_data = [];
    for (var _i = 0, participants_1 = participants; _i < participants_1.length; _i++) {
        var p = participants_1[_i];
        var m_name = '';
        var shortname = '';
        if (p.m_raceNumber.toString() in drivers_data) {
            m_name = drivers_data[p.m_raceNumber].fullname;
            shortname = drivers_data[p.m_raceNumber].shortname;
        }
        else {
            m_name = p.m_name;
        }
        participants_data.push({ "m_name": m_name, "shortname": shortname, "m_raceNumber": p.m_raceNumber, "m_teamId": TEAMS[p.m_teamId].name });
    }
};
client.on(PACKETS.lapData, setLapData);
client.on(PACKETS.participants, setParticipants);
client.on(PACKETS.carStatus, setCarStatus);
// to start listening:
client.start();
