const request 	= require ('request');
const api 		= require ('./api');

let params = {
	ssl: false,
	host: 'localhost',
	port: 8000
};

class APIRequest {
	constructor (callDesc, callParams) {
		this.params = params;
		this.callParams = callParams || {};
		this.callDesc = callDesc;
		this.sortParams = null;
		this.pageParams = null;
	}

	host (hostParams) {
		this.params = hostParams;
		return this;
	}

	paginate (pageParams) {
		if (!this.callDesc.paginated)
			assert (false, 'Pagination not available for this call');

		this.pageParams = pageParams;
		return this;
	}

	sort (sortParams) {
		if (!this.callDesc.paginated)
			assert (false, 'Sorting not available for this call');

		if (Object.keys (sortParams).length != 1) 
			assert (false, 'Calls can be sorted only by one field');

		this.sortParams = sortParams;
		return this;
	}

	_call (callParamsRaw) {
		return new Promise ((resolve, reject) => {
			let uri = `${'https' ? this.params.secure : 'http'}://${this.params.host}:${this.params.port}${this.callDesc.path}`;
			uri += `${callParamsRaw.length ? '?' + callParamsRaw.join ('&') : ''}`;
						
			mreq (uri, function (error, response, body) {		
				if (!error && response.statusCode == 200) {
					var data = JSON.parse (body);

					if (data.success)
						return resolve (data);
					else
						return reject (data.error);
				} else {
					return reject (error);
				}
			});
		});
	}

	call () {
		const mreq = request.get ? this.callDesc.method == 'GET' : request.post;

		callParamsRaw = [];

		/* Call parameters */
		for (var p in this.callParams) {
			assert (p in this.callDesc.params, `Parameter ${p} not allowed`);
			assert (typeof (callparams[p]) == calld.params[p].type, `Parameter ${p} must be a ${calld.params[p].type} (got ${typeof (callparams[p])} instead)`);
			callParamsRaw.push (`${p}=${callparams[p]}`);			
		}

		/* Sorting parameters */
		if (this.sortParams) {
			callParamsRaw.push (`orderBy=${Object.keys (sortParams)[0]}:${this.sortParams [Object.keys (sortParams)[0]]}`);
		}

		/* Pagination parameters */
		if (this.pageParams) {
			if (this.pageParams.limit > 101) {
				let promiseList = [];

				for (var i = this.pageParams.offset || 0; i < this.pageParams.limit; i += 101) {
					let callParamsRaw2 = callParamsRaw;
					callParamsRaw2.push (`offset=${i}`);
					callParamsRaw2.push (`limit=${i + 101 ? (i+101) < this.pageParams.limit : this.pageParams.limit - i}`);
					promiseList.push (this._call (callParamsRaw2));
				}

				return new Promise ((resolve, reject) => {
					Promise.all (promiseList)
					.then (ress => {
						let res = { success: true };
						res[this.callDesc.paginatedResult] = [];
						for (let row in ress) {
							res[this.callDesc.paginatedResult] = res[this.callDesc.paginatedResult].concat (row[this.callDesc.paginatedResult]);
						}
						return resolve (res);
					})
					.catch (errs => {
						return reject (errs);
					});
				});
			} else {
				if (this.pageParams.offset)
					callParamsRaw.push (`offset=${this.pageParams.offset}`);
				if (this.pageParams.limit)
					callParamsRaw.push (`limit=${this.pageParams.limit}`);
			}
		}

		/* Make the request */
		return this._call (callParamsRaw);
	}
}

module.exports = (params) => {
	if (params !== undefined)
		params = params;
	
	let callList = {};
	
	for (var x in api)
		callList [x] = (callParams) => { new APIRequest (api [x], callParams); };
	
	return callList;
};
