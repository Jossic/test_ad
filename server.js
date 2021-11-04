const express = require('express');
const fs = require('fs');
const app = express();

const mock_data = require('./mock_data.json');

app.use(express.json());

// @desc      Get data, sorted & filtered, with pagination & limit
// @route     GET /getData
// @access    Public
app.get('/getData', (req, res) => {
	const { sectors, sortBy, sortedYear, order } = req.query;
	try {
		fs.readFile('mock_data.json', (err, data) => {
			if (err) throw err;

			const json = JSON.parse(data);
			let compArray = [];

			if (sectors) {
				for (const item of json) {
					if (item.sector === sectors) {
						compArray.push(item);
					}
				}
			}

			if (sortBy) {
				let compt;

				if (compArray.length === 0) {
					compArray = [...mock_data];
				}

				if (sortedYear) {
					compArray = compArray.map((item) => {
						item.results = item.results.filter(
							(item) => item.year == sortedYear
						);
						return item;
					});
				}
				compt = compArray.sort((a, b) => {
					if (sortBy === 'name' || sortBy === 'sector') {
						if (b[sortBy] === a[sortBy]) return 0;
						else if (b[sortBy] > a[sortBy])
							return order === 'asc' ? -1 : 1;
						else return order === 'asc' ? 1 : -1;
					} else if (sortBy === 'siren') {
						return order === 'asc'
							? a[sortBy] - b[sortBy]
							: b[sortBy] - a[sortBy];
					} else {
						return order === 'asc'
							? a.results[sortBy] - b.results[sortBy]
							: b.results[sortBy] - a.results[sortBy];
					}
				});

				compArray = [...compt];
			}

			//By default values
			let page = 1;
			let limit = 99999;

			req.query.page && (page = Number(req.query.page));
			req.query.limit && (limit = Number(req.query.limit));

			let index = (Number(page) - 1) * Number(limit);
			let compt2;
			if (compArray.length > 0) {
				compt2 = compArray.slice(index, Number(limit) + index);
			} else {
				compt2 = json.slice(index, Number(limit) + index);
			}
			compArray = [...compt2];

			res.json({
				numberOfItems: compArray.length,
				compArray,
			});
		});
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
});

// @desc      Add a company
// @route     POST /create
// @access    Public
app.post('/create', (req, res) => {
	const { name, sector, siren, results } = req.body;
	const newCompany = {
		name,
		sector,
		siren,
		results,
	};
	try {
		fs.readFile('mock_data.json', (err, data) => {
			if (err) throw err;
			const json = JSON.parse(data);

			if (json.some((item) => item.name === name)) {
				res.status(400).json({
					error: {
						message: 'Cette entreprise existe déja',
					},
				});
			} else {
				json.push(newCompany);

				fs.writeFile('mock_data.json', JSON.stringify(json), (err) => {
					if (err) throw err;
				});
				res.json({ newCompany, message: 'Entreprise ajoutée' });
			}
		});
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
});

// @desc      Delete a company by name
// @route     DELETE /remove
// @access    Public
app.delete('/remove', (req, res) => {
	const { name } = req.body;
	try {
		fs.readFile('mock_data.json', (err, data) => {
			if (err) throw err;
			const json = JSON.parse(data);
			json.map((item, index) => {
				item.name === name && json.splice(index, 1);
			});

			fs.writeFile('mock_data.json', JSON.stringify(json), (err) => {
				if (err) throw err;
			});
		});
		res.json({ message: `L'entreprise ${name} a bien été supprimée` });
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
});

// @desc      Add result to a company
// @route     PATCH /addResult
// @access    Public
app.patch('/addResult', (req, res) => {
	const { name, results } = req.body;
	try {
		fs.readFile('mock_data.json', (err, data) => {
			if (err) throw err;
			const json = JSON.parse(data);
			json.map((item, index) => {
				item.name === name && json[index].results.push(results);
			});

			fs.writeFile('mock_data.json', JSON.stringify(json), (err) => {
				if (err) throw err;
			});
		});
		res.json({
			message: `Les chiffres ont bien été ajoutés a l'entreprise ${name}`,
		});
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
});

const PORT = 8080;

app.listen(PORT, () => {
	console.log(`Server runnning on port ${PORT}...`);
});
