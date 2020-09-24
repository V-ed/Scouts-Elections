export class MinimalDelayer {
	
	/**
	 * 
	 * @param {number} [minimalDelay] 
	 */
	constructor(minimalDelay) {
		
		this.minimalDelay = (minimalDelay > 0 && minimalDelay) || 0;
		this.targetDate = Date.now() + this.minimalDelay;
		
	}
	
	/**
	 * 
	 * @param {() => *} functionToExecute 
	 */
	async execute(functionToExecute) {
		
		/**
		 * 
		 * @param {() => *} functionToExecute 
		 * @param {number} delayRemaining 
		 * @param {(delayRemaining: number) => *} resolve 
		 * @param {(reason: *) => *} reject 
		 */
		function doExecute(functionToExecute, delayRemaining, resolve, reject) {
			try {
				if (functionToExecute) {
					functionToExecute();
				}
				resolve(delayRemaining);
			} catch (error) {
				reject(error);
			}
		}
		
		return new Promise((resolve, reject) => {
			
			const now = Date.now();
			
			const delayRemaining = this.targetDate - now;
			
			if (delayRemaining > 0) {
				setTimeout(() => doExecute(functionToExecute, delayRemaining, resolve, reject), delayRemaining);
			}
			else {
				doExecute(functionToExecute, delayRemaining, resolve, reject);
			}
			
		});
		
	}
	
	async wait() {
		
		return new Promise((resolve, reject) => {
			
			try {
				
				const now = Date.now();
				
				const delayRemaining = this.targetDate - now;
				
				if (delayRemaining > 0) {
					setTimeout(() => resolve(delayRemaining), delayRemaining);
				}
				else {
					resolve(delayRemaining);
				}
				
			} catch (error) {
				
				reject(error);
				
			}
			
		});
		
	}
	
}

export default MinimalDelayer;
