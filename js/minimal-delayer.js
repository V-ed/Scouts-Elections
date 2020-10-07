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
	 * @typedef {{functionResult: T | null, delayPassed: number}} ExecutedResults
	 * @template T
	 */
	
	/**
	 * 
	 * @param {() => T | null} [functionToExecute] 
	 * @returns {Promise<ExecutedResults<T>>}
	 * @template T
	 */
	async execute(functionToExecute) {
		
		/**
		 * 
		 * @param {(results: ExecutedResults<T>) => void} resolve 
		 * @param {(reason: *) => void} reject 
		 * @param {(() => T | null)} [functionToExecute] 
		 * @template T
		 */
		const doExecute = (resolve, reject, functionToExecute) => {
			try {
				let functionResult = null;
				
				if (functionToExecute) {
					functionResult = functionToExecute();
				}
				
				resolve({
					functionResult: functionResult,
					delayPassed: Date.now() - this.targetDate,
				});
			} catch (error) {
				reject(error);
			}
		}
		
		return new Promise((resolve, reject) => {
			
			const delayRemaining = this.targetDate - Date.now();
			
			if (delayRemaining > 0) {
				setTimeout(() => doExecute(resolve, reject, functionToExecute), delayRemaining);
			}
			else {
				doExecute(resolve, reject, functionToExecute);
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
