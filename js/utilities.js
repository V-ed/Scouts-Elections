// Set default variables

const isTouchDevice = "ontouchstart" in document.documentElement;

// Setup downloadable database function

let didDownloadDb = false;
let isDownloadDisabled = false;
let dbIsDirty = false;

function should_download_data() {
	if (isDownloadDisabled) {
		return false;
	}
	return dbIsDirty || !didDownloadDb;
}

function download_data(data, dbNameSuffix) {
	
	const stringData = JSON.stringify(data);
	
	dbNameSuffix = dbNameSuffix || "";
	
	const file = new File([stringData], `${data.dbName}${dbNameSuffix}.json`, {type: "application/json;charset=utf-8"});
	saveAs(file);
	
	didDownloadDb = true;
	dbIsDirty = false;
	
}

// Reload if using back / forward button, therefore correctly cleaning the cache of variables
if (window.performance && window.performance.navigation.type == window.performance.navigation.TYPE_BACK_FORWARD) {
	document.location.reload(true);
}
