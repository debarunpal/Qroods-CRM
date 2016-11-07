angular.module("contactsApp", ['ngRoute'])
    .config(function($routeProvider) {
        $routeProvider
            .when("/", {
                templateUrl: "list.html",
                controller: "ListController",
                resolve: {
                    contacts: function(Contacts) {
                        return Contacts.getContacts();
                    }
                }
            })
            .when("/new/contact", {
                controller: "NewContactController",
                templateUrl: "contact-form.html"
            })
            .when("/contact/:contactId", {
                controller: "EditContactController",
                templateUrl: "contact.html"
            })
			.when("/contact/:contactId/orders", {
                controller: "NewPurchaseController",
                templateUrl: "add-purchase.html"
            })
			.when("/contact/:contactId/orders/:orderId", {
                controller: "EditPurchaseController",
                templateUrl: "add-purchase.html"
            })
            .otherwise({
                redirectTo: "/"
            })
    })
    .service("Contacts", function($http) {
        this.getContacts = function() {
            return $http.get("/contacts").
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error finding contacts.");
                });
        }
        this.createContact = function(contact) {
            return $http.post("/contacts", contact).
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error creating contact.");
                });
        }
        this.getContact = function(contactId) {
            var url = "/contacts/" + contactId;
            return $http.get(url).
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error finding this contact.");
                });
        }
        this.editContact = function(contact) {
            var url = "/contacts/" + contact._id;
            console.log(contact._id);
            return $http.put(url, contact).
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error editing this contact.");
                    console.log(response);
                });
        }
        this.deleteContact = function(contactId) {
            var url = "/contacts/" + contactId;
            return $http.delete(url).
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error deleting this contact.");
                    console.log(response);
                });
        }
    })
	.service("Orders", function($http) {
        this.getOrders = function() {
            return $http.get("/contact/" + contactId + "/order").
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error finding orders.");
                });
        }
        this.createOrder = function(contactId, order) {
            return $http.post("/contact/" + contactId + "/order", order).
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error creating order.");
                });
        }
        this.getOrder = function(orderId) {
            var url = "/contact/" + contactId + "/order/" + orderId;
            return $http.get(url).
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error finding this order.");
                });
        }
        this.editOrder = function(order) {
            var url = "/contact/" + contactId + "/order/" + order._id;
            console.log(order._id);
            return $http.put(url, order).
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error editing this order.");
                    console.log(response);
                });
        }
        this.deleteOrder = function(orderId) {
            var url = "/contact/" + contactId + "/order/" + orderId;
            return $http.delete(url).
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error deleting this order.");
                    console.log(response);
                });
        }
    })
    .controller("ListController", function(contacts, $scope) {
        $scope.contacts = contacts.data;
    })
    .controller("NewContactController", function($scope, $location, Contacts) {
        $scope.back = function() {
            $location.path("#/");
        }

        $scope.saveContact = function(contact) {
            Contacts.createContact(contact).then(function(doc) {
                var contactUrl = "/contact/" + doc.data._id;
                $location.path(contactUrl);
            }, function(response) {
                alert(response);
            });
        }
    })
    .controller("EditContactController", function($scope, $routeParams, Contacts, Orders) {
        Contacts.getContact($routeParams.contactId).then(function(doc) {
            $scope.contact = doc.data;
			$scope.items = [{
				'id': '1',
				name: 'Jeans'
			  }, {
				'id': '2',
				name: 'T-Shirts'
			  }, {
				'id': '3',
				name: 'Lingerie'
			  }, {
				'id': '4',
				name: 'Shirts'
			  }, {
				'id': '5',
				name: 'Kurtis'
			  }, {
				'id': '6',
				name: 'Denims'
			  }];
			  $scope.formData = [];
        }, function(response) {
            alert(response);
        });

        $scope.toggleEdit = function() {
            $scope.editMode = true;
            $scope.contactFormUrl = "contact-form.html";
        }

        $scope.back = function() {
            $scope.editMode = false;
            $scope.contactFormUrl = "";
        }

        $scope.saveContact = function(contact) {
            Contacts.editContact(contact);
            $scope.editMode = false;
            $scope.contactFormUrl = "";
        }

        $scope.deleteContact = function(contactId) {
            Contacts.deleteContact(contactId);
        }
		
		//Purchase controller methods goes here:
		$scope.newPurchase = function() {
            $scope.editMode = true;
            $scope.contactFormUrl = "add-purchase.html";
        }
		
		$scope.saveOrder = function(contact, order) {
			Orders.createOrder(order).then(function(doc) {
				var orderUrl = "/contact/" + contact._id + "/order/" + doc.data._id;
				$location.path(orderUrl);
			}, function(response) {
				alert(response);
			});
		}
	
		$scope.changeQuantity = function (itemId, quantity) {
		var newItem = true;
		angular.forEach($scope.formData, function (value, index) {
		  console.log(value);
		  console.log(index);
		  if (value.item_id === itemId) {
			//remove if quantity 0 or null
			if (quantity === 0 || quantity === null) {
			  $scope.formData.splice(index, 1);
			}else {
			  $scope.formData[index].quantity = quantity;
			}
			newItem = false;
		  }
		});
		
		if (newItem) {
			$scope.formData.push({item_id: itemId, quantity: quantity});
		}
    }
    })