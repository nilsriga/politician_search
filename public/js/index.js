new Vue({
    el: '#app',
    data: {
        politicians: [],
        allPoliticians: [],
        howManyPages: 0,
        paginationPages: [],
        offset: 0,
        page: 0,
        searchField: ""
    },
    mounted() {
        this.getPoliticians(),
            this.countPoliticians()
    },
    methods: {
        countPoliticians() {
            axios.get('/politiciansCount')
                .then((response) => {
                    this.allPoliticians = response.data.politicians[0]["Count(*)"];
                    this.howManyPages = Math.floor(this.allPoliticians / 20);
                    this.paginationPages = Array.from(Array(this.howManyPages + 1).keys());
                })
                .catch((error) => {
                    console.log(error);
                });
        },
        getPoliticians(offset) {
            this.politicians = [];
            axios.get('/politicians/' + (offset != undefined ? offset : this.offset))
                .then((response) => {
                    this.politicianName = response.data.politicians.forEach((politician) => {
                        this.getMemberships(politician);
                    });
                })
                .catch((error) => {
                    console.log(error);
                });
        },
        getMemberships(politician) {
            var politicianMemberships = [];
            politician.memberships = politicianMemberships;
            this.politicians.push(politician);
            axios.get('/politicians/memberships/' + politician.person_id)
                .then((response) => {
                    response.data.politicians.forEach((membership) => {
                        politicianMemberships.push(membership)
                    })
                })
                .catch((error) => {
                    console.log(error);
                });
        },
        searchPoliticians() {
            if (this.searchField != "") {
                this.politicians = [];
                this.searchField = this.searchField.charAt(0).toUpperCase() + this.searchField.slice(1);
                axios.get('/politicians/search/' + this.searchField)
                    .then((response) => {
                        this.politicianName = response.data.politicians.forEach((politician) => {
                            this.allPoliticians = this.politicians.length;
                            this.howManyPages = Math.floor(this.allPoliticians / 20);
                            this.paginationPages = Array.from(Array(this.howManyPages + 1).keys());
                            this.getMemberships(politician);
                        });
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            } else {
                this.countPoliticians();
                this.getPoliticians();
            }
        },
        getNextPage() {
            if (this.page < 10) {
                this.offset = this.offset + 20;
                this.page++
            }
            this.politicians = [];
            this.getPoliticians();
        },
        getPreviousPage() {
            if (this.offset <= 0) { } else {
                this.offset = this.offset - 20;
                this.page--;
            }
            this.politicians = [];
            this.getPoliticians();
        }
    }
})