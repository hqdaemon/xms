'use strict';

const cluster = require("cluster");

let argv = process.argv;
global.DEV = argv && argv[2] === "DEV";
var confPath = (DEV)?"dev":"prod";
global.conf = require(`../../conf/${confPath}`);
global.workDir = conf.sys.root+"/"+((DEV)?"sandbox":"prod");
if(DEV){
	global.prodConf = require(`../../conf/prod`);
}

global.fs = require("fs");
global.md5 = require("md5");
global.moment = require("moment-timezone");
global.useragent = require("express-useragent");


global.utils = require("./utils");
global.marked = utils.marked;

global.translit = require("@hqdaemon/translit");

global.jscompose = require("@hqdaemon/jscompose");
global.minify = require("@hqdaemon/minify");
global.hqDB = require("@hqdaemon/db");

global.SVGSpriter = require("svg-sprite");
global.sharp = require("sharp");

global.nodemailer = require("nodemailer");
global.geoip = require("geoip-lite");

const {exec, execSync} = require("child_process");
global.execSync = execSync;

async function init(){
	global.mongodb = await hqDB({type:"mongo"});
	global.mongo = mongodb.client;
	global.db = await mongo.db(conf.sys.db.name);
	if(DEV){
		global.prodDB = await mongo.db(prodConf.sys.db.name);
	}
	if (cluster.isMaster) {
		let master = require("./master");
	} else {
		let app = require("./app");
	}

	global.i18n = require("./classes/i18n");
}

init();