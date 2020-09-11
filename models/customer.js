/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
    this.fullName = this.fullName();
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }
/** Search for customers by name */

  static async search(searchedName) {
    const results = await db.query(
      `SELECT id, 
      first_name AS "firstName",  
      last_name AS "lastName", 
      phone, 
      notes
      FROM customers
      WHERE first_name LIKE $1
      OR last_name LIKE $1
      `, [`%${searchedName}%`]
    );
    if (results.rows.length === 0) {
      const err = new Error(`No matching customer on: ${searchedName}`);
      err.status = 404;
      throw err;
    }
    return results.rows.map(c => new Customer(c));

  }

  /** Get best customers */

  static async best() {
    const results = await db.query(
      `SELECT customers.id, 
      first_name AS "firstName",  
      last_name AS "lastName", 
      phone, 
      customers.notes 
      FROM customers 
      JOIN reservations 
      ON customer_id = customers.id 
      GROUP BY customers.id, first_name, last_name 
      ORDER BY COUNT(customer_id) DESC 
      LIMIT 10`
    );
    if (results.rows.length === 0) {
      const err = new Error(`No matching customer on: ${searchedName}`);
      err.status = 404;
      throw err;
    }
    return results.rows.map(c => new Customer(c));

  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }

  fullName(){
    const fullname = `${this.firstName} ${this.lastName}`;
    this.fullName = fullname;
    return fullname;
  }
}

module.exports = Customer;
