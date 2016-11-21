A.app({
  appName: "Customer CRM",
  appIcon: "users",
  onlyAuthenticated: true,
  //allowSignUp: true,  
  menuItems: [   
    {    
      name: "Contact",    
      entityTypeId: "Contact",    
      icon: "user"    
    }, {    
      name: "Board",    
      entityTypeId: "FlowBoard",    
      icon: "bars"
    }, {
      name: "Statuses",
      entityTypeId: "Status",
      icon: "sort"
    }, {
      name: "Transactions",
      entityTypeId: "Transaction",
      icon: "send-o"
    }, {
      name: "Items",
      entityTypeId: "Item",
      icon: "cubes"
    }, {
      name: "Orders",
      entityTypeId: "Order",
      icon: "shopping-cart"
    },
    {
      name: "POS",
      entityTypeId: "PointOfSale",
      icon: "calculator"
    }, {
      name: "Analytics",
      entityTypeId: "Analytics",
      icon: "table"
    }
  ],
  entities: function(Fields) {
    return {
      Contact: {
        fields: {
          firstName: Fields.text("First name").required(),
		  lastName: Fields.text("Last name").required(),
		  fullName: Fields.text('Full name').readOnly(),
          email: Fields.email("Email").required(),
          phone: Fields.text("Phone").required(),
		  contactBirthDate: Fields.date("Date of Birth"),
		  contactAnniversaryDate: Fields.date("Date of Anniversary"),
		  //firstShoppingDate: Fields.date("First shopping date"),
          //lastContactDate: Fields.date("Last contact date"),  
          status: Fields.fixedReference("Status", "Status")
        },
		beforeSave: function (Entity) {
			Entity.fullName = Entity.firstName + ' ' + Entity.lastName;
		},
		showInGrid: ['fullName', 'email', 'phone'],
        views: {  
          FlowBoard: {
            customView: "board" 
          }
        }
      },
      Status: {
        fields: {
          name: Fields.text("Name").required(),
          order: Fields.integer("Order").required()
        },
        sorting: [['order', 1]],
        referenceName: "name"
      },
	  Analytics: {
		fields: {

        },
		views: {
          Analytics: {
            customView: 'analytics'
          }
        }
	  },
	  Transaction: {
        fields: {
          item: Fields.reference("Item", "Item"),
          order: Fields.reference("Order", "Order"),
          orderItem: Fields.reference("Order item", "OrderItem"),
          quantity: Fields.integer("Quantity")
        },
        showInGrid: ['item', 'order', 'quantity']
      },
      Item: {
        fields: {
          name: Fields.text("Name"),
          stock: Fields.integer("Stock").computed('sum(transactions.quantity)'),
          price: Fields.money("Price"),
          transactions: Fields.relation("Transactions", "Transaction", "item")
        },
        referenceName: "name"
      },
      Order: {
        fields: {
          number: Fields.integer("Order #"),
          phone: Fields.reference("Contact", "Contact"),
          date: Fields.date("Date"),
          total: Fields.money("Total").computed('sum(orderItems.finalPrice)'),
          orderItems: Fields.relation("Items", "OrderItem", "order")
        },
        beforeSave: function (Entity, Dates, Crud) {
          if (!Entity.date) {
            Entity.date = Dates.nowDate();
          }
          return Crud.crudFor('OrderCounter').find({}).then(function (last) {
            if (!Entity.number) {
              Entity.number = last[0].number;
              return Crud.crudFor('OrderCounter').updateEntity({id: last[0].id, number: last[0].number + 1});  
            }
          })
        },
        beforeDelete: function (Entity, Crud, Q) {
          var crud = Crud.crudFor('OrderItem');
          return crud.find({filtering: {order: Entity.id}}).then(function (items) {
            return Q.all(items.map(function (i) { return crud.deleteEntity(i.id) }));
          });
        },
		referenceName: "number",
		views: {
          PointOfSale: {
            customView: 'pos'
          }
        }
	  },
	  OrderItem: {
        fields: {
          order: Fields.reference("Order", "Order"),
          item: Fields.fixedReference("Item", "Item").required(),
          quantity: Fields.integer("Quantity").required(),
          finalPrice: Fields.money("Final price").readOnly().addToTotalRow()
        },
        showInGrid: ['item', 'quantity', 'finalPrice'],
        beforeSave: function (Crud, Entity) {
          return Crud.crudFor('Item').readEntity(Entity.item.id).then(function (item) {
            Entity.finalPrice = Entity.quantity * item.price;
          })
        },
        afterSave: function (Crud, Entity) {
          var crud = Crud.crudForEntityType('Transaction');
          return removeTransactions(Crud, Entity).then(function () {
            return crud.createEntity({
              order: Entity.order, 
              orderItem: {id: Entity.id},
              item: Entity.item,
              quantity: Entity.quantity * -1
            })
          })
        },
        beforeDelete: function (Crud, Entity) {
          return removeTransactions(Crud, Entity);
        }
      },
      OrderCounter: {
        fields: {
          number: Fields.integer("Counter")
        }
      },
    }
  },
  migrations: function (Migrations) { return [
    {
      name: "statuses",
      operation: Migrations.insert("Status", [
        {id: "1", name: "Message Sent", order: 1}, 
        {id: "2", name: "Email Sent", order: 2},
        {id: "3", name: "Query Received", order: 3}, 
        {id: "4", name: "Casual View", order: 4},
        {id: "5", name: "Revisited", order: 5},
		{id: "6", name: "First Visit", order: 6},
		{id: "7", name: "Word of Mouth", order: 7},
		{id: "8", name: "Social Media", order: 8}
      ])
    }
  ]}   
});

function removeTransactions(Crud, Entity) {
  var crud = Crud.crudForEntityType('Transaction');
  return crud.find({filtering: {orderItem: Entity.id}}).then(function (transactions) {
    if (transactions.length) {
      return crud.deleteEntity(transactions[0].id);
    }
  });
}