import AsyncStorage from "@react-native-async-storage/async-storage";
import NoAPI from "../utils/api";
import { empty, validJSON } from "../utils/utils";

export function login(url, username, password) {
	return new Promise((resolve, reject) => {
		let isFulfilled = false;

		if (empty(url) || empty(username) || empty(password)) {
			isFulfilled = true;
			reject("All fields must be filled out.");
		} else {
			setTimeout(() => {
				if (!isFulfilled) {
					isFulfilled = true;
					reject("Login failed. Make sure the API URL is valid.");
				}
			}, 5000);

			if (!url.includes("http://") && !url.includes("https://")) {
				url = "http://" + url;
			}

			let lastCharacter = url.substr(url.length - 1);
			if (lastCharacter !== "/") {
				url = url + "/";
			}

			let endpoint = url + "accounts/login.php?platform=app";

			let body = { username: username, password: password };

			fetch(endpoint, {
				body: JSON.stringify(body),
				method: "POST",
				headers: {
					Accept: "application/json", "Content-Type": "application/json"
				}
			})
				.then((json) => {
					return json.json();
				})
				.then(async (response) => {
					if ("error" in response) {
						isFulfilled = true;
						reject(response.error);
					} else {
						if (response.valid) {
							isFulfilled = true;
							resolve({ token: response.token, username: response.username, api: url });
						}
					}
				}).catch(error => {
					isFulfilled = true;
					reject("Login failed. Make sure the API URL is valid.");
					console.log(error);
				});
		}
	});
}

export async function verifySession(token) {
	return new Promise(async (resolve, reject) => {
		let isFulfilled = false;

		if (empty(token)) {
			isFulfilled = true;
			reject("Token not found.");
		} else {
			setTimeout(() => {
				if (!isFulfilled) {
					isFulfilled = true;
					reject("Login failed. Make sure the API URL is valid.");
				}
			}, 5000);

			let api = await AsyncStorage.getItem("api");
			let username = await AsyncStorage.getItem("username");

			let endpoint = api + "accounts/login.php?platform=app";

			let body = { token: token, username: username };

			fetch(endpoint, {
				body: JSON.stringify(body),
				method: "POST",
				headers: {
					Accept: "application/json", "Content-Type": "application/json"
				}
			})
				.then((json) => {
					return json.json();
				})
				.then(async (response) => {
					if ("valid" in response && response.valid) {
						isFulfilled = true;
						resolve(response);
					} else {
						await AsyncStorage.removeItem("token");
						isFulfilled = true;
						reject("Invalid token.");
					}
				}).catch(error => {
					isFulfilled = true;
					reject("Login failed. Make sure the API URL is valid.");
					console.log(error);
				});
		}
	});
}

export async function getCoinID(key, value) {
	return new Promise(async (resolve, reject) => {
		if (empty(await AsyncStorage.getItem("NoAPIMode"))) {
			let api = await AsyncStorage.getItem("api");
			let token = await AsyncStorage.getItem("token");
			let username = await AsyncStorage.getItem("username");

			fetch("https://api.coingecko.com/api/v3/search?query=" + value, {
				method: "GET",
				headers: {
					Accept: "application/json", "Content-Type": "application/json"
				}
			})
				.then(function (response) {
					return response.json();
				})
				.then((data) => {
					if (data.coins.length > 0) {
						data.coins.forEach(coin => {
							if (coin.symbol.trim().toLowerCase() === value) {
								let _coin = key == 'symbol' ? coin.symbol.trim().toLowerCase() : coin.id;
								let endpoint = api + "coins/read.php?" + key + "=" + _coin + "&token=" + token + "&username=" + username;

								fetch(endpoint, {
									method: "GET",
									headers: {
										Accept: "application/json", "Content-Type": "application/json"
									}
								})
									.then((json) => {
										return json.json();
									})
									.then(async (response) => {
										resolve(response);
									}).catch(error => {
										console.log(error);
										reject(error);
									});
							}
						});
					}
					else {
						reject("No coins is found");
					}
				})
		} else {
			let data = await AsyncStorage.getItem("NoAPI");
			if (validJSON(data)) {
				data = JSON.parse(data);
			} else {
				data = {};
			}

			let noAPI = new NoAPI(data, "mobile", AsyncStorage);
			noAPI.readCoins({ [key]: value }).then(response => {
				resolve(response);
			}).catch(error => {
				console.log(error);
				reject(error);
			});
		}
	});
}

export async function getETHAddressBalance(address) {
	return new Promise(async (resolve, reject) => {
		let endpoint = "https://api.ethplorer.io/getAddressInfo/" + address + "?apiKey=freekey";

		fetch(endpoint, {
			method: "GET",
			headers: {
				Accept: "application/json", "Content-Type": "application/json"
			}
		})
			.then((json) => {
				return json.json();
			})
			.then(async (response) => {
				resolve(response);
			}).catch(error => {
				console.log(error);
				reject(error);
			});
	});
}

export async function importData(type, rows) {
	return new Promise(async (resolve, reject) => {
		if (empty(await AsyncStorage.getItem("NoAPIMode"))) {
			let isFulfilled = false;

			setTimeout(() => {
				if (!isFulfilled) {
					isFulfilled = true;
					reject("Data Import Failed");
				}
			}, 10000);

			let api = await AsyncStorage.getItem("api");
			let token = await AsyncStorage.getItem("token");
			let username = await AsyncStorage.getItem("username");

			let endpoint = api + "holdings/import.php";

			if (type === "activity") {
				endpoint = api + "activity/import.php";
			}

			let body = { token: token, username: username, rows: rows };

			fetch(endpoint, {
				body: JSON.stringify(body),
				method: "POST",
				headers: {
					Accept: "application/json", "Content-Type": "application/json"
				}
			})
				.then((json) => {
					return json.json();
				})
				.then(async (response) => {
					if ("error" in response) {
						reject(response.error);
					} else {
						resolve(response.message);
					}
				}).catch(error => {
					isFulfilled = true;
					reject("Data Import Failed");
					console.log(error);
				});
		} else {
			let data = await AsyncStorage.getItem("NoAPI");
			if (validJSON(data)) {
				data = JSON.parse(data);
			} else {
				data = {};
			}

			let noAPI = new NoAPI(data, "mobile", AsyncStorage);
			let response;

			if (type === "holdings") {
				noAPI.importHoldings(rows);
			} else {
				noAPI.importActivity(rows);
			}

			if ("error" in response) {
				reject(response.error);
			} else {
				resolve(response.message);
			}
		}
	});
}

export async function addHolding(id, symbol, amount) {
	return new Promise(async (resolve, reject) => {
		if (empty(await AsyncStorage.getItem("NoAPIMode"))) {
			let api = await AsyncStorage.getItem("api");
			let token = await AsyncStorage.getItem("token");
			let username = await AsyncStorage.getItem("username");

			let endpoint = api + "holdings/create.php";
			let method = "POST";
			let body = { token: token, username: username, id: id, symbol: symbol, amount: amount };

			fetch(endpoint, {
				method: method,
				body: JSON.stringify(body),
				headers: {
					Accept: "application/json", "Content-Type": "application/json"
				}
			})
				.then((json) => {
					return json.json();
				})
				.then(async (response) => {
					if ("message" in response) {
						resolve();
					} else {
						reject();
					}
				}).catch(error => {
					console.log(error);
					reject(error);
				});
		} else {
			let data = await AsyncStorage.getItem("NoAPI");
			if (validJSON(data)) {
				data = JSON.parse(data);
			} else {
				data = {};
			}

			let noAPI = new NoAPI(data, "mobile", AsyncStorage);
			let response = noAPI.createHoldings(id, symbol, amount);
			if ("message" in response) {
				resolve();
			} else {
				reject();
			}
		}
	});
}

export async function updateHolding(id, amount) {
	return new Promise(async (resolve, reject) => {
		if (empty(await AsyncStorage.getItem("NoAPIMode"))) {
			let api = await AsyncStorage.getItem("api");
			let token = await AsyncStorage.getItem("token");
			let username = await AsyncStorage.getItem("username");

			let endpoint = api + "holdings/update.php";
			let method = "PUT";
			let body = { token: token, username: username, id: id, amount: amount };

			fetch(endpoint, {
				method: method,
				body: JSON.stringify(body),
				headers: {
					Accept: "application/json", "Content-Type": "application/json"
				}
			})
				.then((json) => {
					return json.json();
				})
				.then(async (response) => {
					if ("message" in response) {
						resolve();
					} else {
						reject();
					}
				}).catch(error => {
					console.log(error);
					reject(error);
				});
		} else {
			let data = await AsyncStorage.getItem("NoAPI");
			if (validJSON(data)) {
				data = JSON.parse(data);
			} else {
				data = {};
			}

			let noAPI = new NoAPI(data, "mobile", AsyncStorage);
			let response = noAPI.updateHoldings(id, amount);
			if ("message" in response) {
				resolve();
			} else {
				reject();
			}
		}
	});
}

export async function getWatchlist() {
	return new Promise(async (resolve, reject) => {
		if (empty(await AsyncStorage.getItem("NoAPIMode"))) {
			let api = await AsyncStorage.getItem("api");
			let token = await AsyncStorage.getItem("token");
			let username = await AsyncStorage.getItem("username");

			let endpoint = api + "watchlist/read.php?platform=app&token=" + token + "&username=" + username;

			fetch(endpoint, {
				method: "GET",
				headers: {
					Accept: "application/json", "Content-Type": "application/json"
				}
			})
				.then((response) => {
					return response.json();
				})
				.then(async (watchlist) => {
					resolve(watchlist);
				}).catch(error => {
					console.log(error);
					reject(error);
				});
		} else {
			let data = await AsyncStorage.getItem("NoAPI");
			if (validJSON(data)) {
				data = JSON.parse(data);
			} else {
				data = {};
			}

			let noAPI = new NoAPI(data, "mobile", AsyncStorage);
			resolve(noAPI.readWatchlist());
		}
	});
}

export async function createWatchlist(id, symbol) {
	return new Promise(async (resolve, reject) => {
		if (empty(await AsyncStorage.getItem("NoAPIMode"))) {
			let api = await AsyncStorage.getItem("api");
			let token = await AsyncStorage.getItem("token");
			let username = await AsyncStorage.getItem("username");

			let endpoint = api + "watchlist/create.php";

			let body = { token: token, username: username, id: id, symbol: symbol };

			fetch(endpoint, {
				body: JSON.stringify(body),
				method: "POST",
				headers: {
					Accept: "application/json", "Content-Type": "application/json"
				}
			})
				.then((json) => {
					return json.json();
				})
				.then((response) => {
					if ("error" in response) {
						reject(response.error);
					} else {
						resolve(response.message);
					}
				}).catch(error => {
					console.log(error);
					reject(error);
				});
		} else {
			let data = await AsyncStorage.getItem("NoAPI");
			if (validJSON(data)) {
				data = JSON.parse(data);
			} else {
				data = {};
			}

			let noAPI = new NoAPI(data, "mobile", AsyncStorage);
			let response = noAPI.createWatchlist(id, symbol);
			if ("message" in response) {
				resolve(response.message);
			} else {
				reject(response.error);
			}
		}
	});
}

export async function deleteWatchlist(id) {
	return new Promise(async (resolve, reject) => {
		if (empty(await AsyncStorage.getItem("NoAPIMode"))) {
			let api = await AsyncStorage.getItem("api");
			let token = await AsyncStorage.getItem("token");
			let username = await AsyncStorage.getItem("username");

			let endpoint = api + "watchlist/delete.php";

			let body = { token: token, username: username, id: id };

			fetch(endpoint, {
				body: JSON.stringify(body),
				method: "DELETE",
				headers: {
					Accept: "application/json", "Content-Type": "application/json"
				}
			})
				.then((json) => {
					return json.json();
				})
				.then((response) => {
					if ("error" in response) {
						reject(response.error);
					} else {
						resolve(response.message);
					}
				}).catch(error => {
					console.log(error);
					reject(error);
				});
		} else {
			let data = await AsyncStorage.getItem("NoAPI");
			if (validJSON(data)) {
				data = JSON.parse(data);
			} else {
				data = {};
			}

			let noAPI = new NoAPI(data, "mobile", AsyncStorage);
			let response = noAPI.deleteWatchlist(id);
			if ("message" in response) {
				resolve(response.message);
			} else {
				reject(response.error);
			}
		}
	});
}