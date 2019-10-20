var didDownloadDb = false;

function download_data(data) {
	
	var stringData = JSON.stringify(data);
	
	var file = new File([stringData], `${data.dbName}.json`, {type: "application/json;charset=utf-8"});
	saveAs(file);
	
	didDownloadDb = true;
	
}

// Reload if using back / forward button, therefore correctly cleaning the cache of variables
if (window.performance && window.performance.navigation.type == window.performance.navigation.TYPE_BACK_FORWARD) {
	document.location.reload(true);
}
