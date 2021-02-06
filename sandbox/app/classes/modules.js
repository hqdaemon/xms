var modules = {
	list: {},
	init: async () => {
		modules.load(workDir+"/modules/sys");
		modules.load(workDir+"/modules/custom");
		console.log(modules.list);
	},
	load: async (modulesPath) => {
		fs.readdirSync(modulesPath, {withFileTypes: true}).forEach(dirent => {
			if(dirent.isDirectory()){
				let moduleName = dirent.name;
				let modulePath = modulesPath+"/"+moduleName;
				let item = {
					name: moduleName,
					path: modulePath,
					app: require(modulePath+"/app.js")
				};
				modules.list[moduleName] = item;
			};
		});
	},
	get: (name, currentPage) => {
		if(modules.list[name] !== undefined){
			return modules.list[name].app.get(currentPage);
		}
		return false;
	}
};
module.exports = modules;