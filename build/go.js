const {execSync} = require("child_process");
const fs = require("fs");
const chalk = require("chalk");
const readline = require("readline").createInterface({
	input: process.stdin,
	output: process.stdout
});

let rootPath = __dirname.replace("/build","");
let projectName;
let projectDesc;
let domainName;
let sandboxDomainName;
let imgDomainName;
let prodPort = 12137;
let devPort = 12138;
let devConf = fs.readFileSync("build/src/conf/dev.json").toString();
let prodConf = fs.readFileSync("build/src/conf/prod.json").toString();

var go = {
	init: async () => {
		console.log(`\n${chalk.yellow.bold("Let's setting up your site!")}\n\n`);
		
		fs.mkdirSync("conf");
		fs.mkdirSync("nginx/sites-enabled", {recursive: true});

		go.next();
	},
	currentStep: 0,
	next: () => {
		let steps = Object.keys(go.steps);
		let step = steps[go.currentStep];
		if(step !== undefined){
			go.currentStep++;
			go.steps[step]();
		} else {

			let nginxConf = fs.readFileSync("build/src/nginx/nginx.conf").toString();
			nginxConf = nginxConf.replace(/DOMAIN_NAME/g,domainName);
			nginxConf = nginxConf.replace(/ROOT_PATH/g,rootPath);
			fs.writeFileSync("nginx/nginx.conf",nginxConf);

			let nginxServerConf = fs.readFileSync("build/src/nginx/server.conf").toString();

			// Prod Nginx
			let prodServerConf = nginxServerConf.replace(/DOMAIN_NAME/g,domainName);
				prodServerConf = prodServerConf.replace(/PORT/g,prodPort);
				prodServerConf = prodServerConf.replace(/ROOT_PATH/g,rootPath);
				prodServerConf = prodServerConf.replace(/DOMAIN_TYPE/g,"prod");
			fs.writeFileSync("nginx/sites-enabled/"+domainName,prodServerConf);

			// Sandbox Nginx
			let sandboxServerConf = nginxServerConf.replace(/DOMAIN_NAME/g,sandboxDomainName);
				sandboxServerConf = sandboxServerConf.replace(/PORT/g,devPort);
				sandboxServerConf = sandboxServerConf.replace(/ROOT_PATH/g,rootPath);
				sandboxServerConf = sandboxServerConf.replace(/DOMAIN_TYPE/g,"sandbox");
			fs.writeFileSync("nginx/sites-enabled/"+sandboxDomainName,sandboxServerConf);

			// Img Nginx
			let imgServerConf = fs.readFileSync("build/src/nginx/img.conf").toString();
			imgServerConf = imgServerConf.replace(/DOMAIN_NAME/g,imgDomainName);
			imgServerConf = imgServerConf.replace(/ROOT_PATH/g,rootPath);
			fs.writeFileSync("nginx/sites-enabled/"+imgDomainName,imgServerConf);


			// Favicon
			let FAVICON_URL = "https://"+imgDomainName+"/favicon/v1";

			let headAdminModule = fs.readFileSync("build/src/sandbox/admin/views/modules/head.html").toString();
			headAdminModule = headAdminModule.replace(/FAVICON_URL/g,FAVICON_URL);
			fs.writeFileSync("sandbox/admin/views/modules/head.html",headAdminModule);

			let headModule = fs.readFileSync("build/src/sandbox/views/modules/head.html").toString();
			headModule = headModule.replace(/FAVICON_URL/g,FAVICON_URL);
			fs.writeFileSync("sandbox/views/modules/head.html",headModule);

			
			execSync("cp -a build/src/img/favicon/. img/favicon");

			let browserconfig = fs.readFileSync("img/favicon/v1/browserconfig.xml").toString();
			browserconfig = browserconfig.replace(/FAVICON_URL/g, FAVICON_URL);
			fs.writeFileSync("img/favicon/v1/browserconfig.xml",browserconfig);
			
			let webmanifest = fs.readFileSync("img/favicon/v1/site.webmanifest").toString();
			webmanifest = webmanifest.replace(/FAVICON_URL/g, FAVICON_URL);
			fs.writeFileSync("img/favicon/v1/site.webmanifest",webmanifest);


			// Write Conf files
			devConf = devConf.replace("PROJECT_NAME",projectName);
			devConf = devConf.replace("PROJECT_DESC",projectDesc);
			fs.writeFileSync("conf/dev.json",devConf);
			fs.writeFileSync("conf/prod.json",prodConf);
			console.log(chalk.yellow(`\n
-------------------------------------------------------------\n
All is done and we're ready to work with your new web site :)\n
-------------------------------------------------------------\n\n
1. Create your app through "screen -S YOUR_DEV_SCREEN_NAME"\n
2. Launch you app "./init"\n
3. Exit from the screen "ctrl + A + D"\n
4. Reopen your dev screen "screen -dr YOUR_DEV_SCREEN_NAME"\n
5. Manually configuration /conf/*\n
6. Production screen name is "${projectName}"\n
\n
`));
			readline.close();
		}
	},
	steps: {
		setRoot: () => {
			readline.question(`${go.currentStep+1}. Root location is ${chalk.bold.green(rootPath)} right?
Press Enter for use this path or type another: `, input => {
				rootPath = (!input || input==="y")?rootPath:input;
				console.log(`\nGreate! I set root location to ${chalk.bold(rootPath)}\n`);

				let initFile = fs.readFileSync("build/src/init").toString();
				initFile = initFile.replace(/ROOT_PATH/g,rootPath);
				devConf = devConf.replace(/ROOT_PATH/g,rootPath);
				prodConf = prodConf.replace(/ROOT_PATH/g,rootPath);
				fs.writeFileSync("init",initFile);
				go.next();
			});
		},
		projectName: () => {
			readline.question(`
${go.currentStep+1}. Project Name: `, input => {
				if(!input){
					console.log(chalk.red("\nNope. You need to set it."));
					go.steps.setSandboxDomain();
				} else {
					projectName = input;
					let restartFile = fs.readFileSync("build/src/restart").toString();
					restartFile = restartFile.replace(/ROOT_PATH/g,rootPath);
					restartFile = restartFile.replace(/PRODUCTION_SCREEN_NAME/g,input);
					fs.writeFileSync("restart",restartFile);
					go.next();
				}
			});
		},
		projectDesc: () => {
			readline.question(`
${go.currentStep+1}. Project Description: `, input => {
				projectDesc = input || "Really cool stuff";
				go.next();
			});
		},
		setDomain: () => {
			readline.question(`
${go.currentStep+1}. Domain Name without http(s)://: `, input => {
				if(!input){
					console.log(chalk.red("\nNope. You need to set it."));
					go.steps.setSandboxDomain();
				} else {
					domainName = input;
					prodConf = prodConf.replace(/FULL_DOMAIN_NAME/g,domainName);
					prodConf = prodConf.replace(/SSL_DOMAIN_NAME/g,domainName);
					go.next();
				}
			});
		},
		setSandboxDomain: () => {
			sandboxDomainName = `sandbox.${domainName}`;
			readline.question(`
${go.currentStep+1}. Sandbox Domain Name
Press Enter to use ${chalk.bold(sandboxDomainName)} or type another: `, input => {
				sandboxDomainName = input || sandboxDomainName;
				devConf = devConf.replace(/FULL_DOMAIN_NAME/g,sandboxDomainName);
				devConf = devConf.replace(/SSL_DOMAIN_NAME/g,sandboxDomainName);
				go.next();
			});
		},
		setSandboxImgPath: () => {
			imgDomainName = `img.${domainName}`;
			readline.question(`
${go.currentStep+1}. Domain storing images
Press Enter to set ${chalk.bold(imgDomainName)} or type another: `, input => {
				imgDomainName = input || imgDomainName;
				devConf = devConf.replace(/IMG_PATH/g,"https://"+imgDomainName);
				prodConf = prodConf.replace(/IMG_PATH/g,"https://"+imgDomainName);
				go.next();
			});
		},
		setProdPort: () => {
			readline.question(`
${go.currentStep+1}. Production Server Port. Press Enter to use ${chalk.bold(prodPort)} or type another: `, input => {
				prodPort = parseInt(input || prodPort, 10);
				prodConf = prodConf.replace(/\"PORT\"/g,prodPort);
				go.next();
			});
		},
		setSandboxPort: () => {
			readline.question(`
${go.currentStep+1}. Sandbox Server Port. (!) Do not use production port ${prodPort}.
Press Enter to use ${chalk.bold(devPort)} or type another: `, input => {
				let port = parseInt(input || devPort, 10);
				if(port === prodPort){
					console.log(chalk.red(`\nDo not use production port ${prodPort}`));
					go.steps.setSandboxPort();
				} else {
					devPort = port;
					devConf = devConf.replace(/\"PORT\"/g,devPort);
					go.next();
				}
			});
		},
		setProdDB: () => {
			let dbName = projectName;
			readline.question(`
${go.currentStep+1}. Production DB name. Press Enter to use ${chalk.bold(dbName)} or type another: `, input => {
				dbName = input || dbName;
				prodConf = prodConf.replace(/DB_NAME/g,dbName);
				go.next();
			});
		},
		setSandboxDB: () => {
			let dbName = projectName+"Dev";
			readline.question(`
${go.currentStep+1}. Sandbox DB name. Press Enter to use ${chalk.bold(dbName)} or type another: `, input => {
				dbName = input || dbName;
				devConf = devConf.replace(/DB_NAME/g,dbName);
				go.next();
			});
		},
		setIPRestrict: () => {
			readline.question(`
${go.currentStep+1}. Set Restrict by IP for sandbox access
You can set several splitted by comma: `, input => {
				let ipAccess = input || false;
				if(ipAccess){
					ipAccess = "["+ipAccess.split(",").map(el => `"${el}"`).join(",")+"]";
				}
				devConf = devConf.replace(/\"IP_ACCESS\"/g,ipAccess);
				go.next();
			});
		}
	}
};
go.init();