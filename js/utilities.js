var didDownloadDb = false;

function download_data(data) {
	
	var stringData = JSON.stringify(data);
	
	var file = new File([stringData], `${data.dbName}.json`, {type: "application/json;charset=utf-8"});
	saveAs(file);
	
	didDownloadDb = true;
	
}
