const connectDb = require('../config/database')


const createProducts = async (shop_id, category_id, product_name, product_price, product_thumbnail, product_description, product_stock, product_sold, created_at) => {
  const connection = await connectDb()

  try {

    const query_statement = `
      INSERT INTO
        products
        (
          shop_id,
          category_id,
          product_name,
          product_price,
          product_thumbnail,
          product_description,
          product_stock,
          product_sold,
          created_at
        )
      VALUES
        (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?
        )
    `

    const [products] = await connection.execute(query_statement, [shop_id, category_id, product_name, product_price, product_thumbnail, product_description, product_stock, product_sold, created_at])

    return products
  } catch (error) {
    throw new Error(error);
  }
}


const getAllProducts = async () => {
  const connection = await connectDb()

  try {
    const query_statement = `
      SELECT
        p.*, s.shop_name, c.city_name, cat.category_name
      FROM
        products AS p
      INNER JOIN
        categories AS cat
      ON
        p.category_id = cat.category_id
      INNER JOIN
        shops AS s
      ON
        p.shop_id = s.shop_id
      INNER JOIN
        cities AS c
      ON
        s.city_id = c.city_id
      LIMIT 10
    `

    const [products] = await connection.execute(query_statement)
    return products

  } catch (error) {
    throw new Error(error);
  }
}


const getProductById = async (productId) => {
  const connection = await connectDb()

  try {
    const query_statement = `
      SELECT
        p.*,
        s.shop_name,
        s.shop_address,
        s.shop_contact,
        c.city_name,
        cat.category_name
      FROM
        products AS p
      INNER JOIN
        categories AS cat
      ON
        p.category_id = cat.category_id
      INNER JOIN
        shops AS s
      ON
        p.shop_id = s.shop_id
      INNER JOIN
        cities AS c
      ON
        s.city_id = c.city_id
      WHERE
        p.product_id = ?
    `

    const [products] = await connection.execute(query_statement, [productId])
    return products

  } catch (error) {
    throw new Error(error);
  }
}


const updateProduct = async (product_id, category_id, product_name, product_price, product_thumbnail, product_description, product_stock, product_sold) => {
  const connection = await connectDb()

  try {
    const query_statement = `
      UPDATE
        products
      SET
        category_id = ?,
        product_name = ?,
        product_price = ?,
        product_thumbnail = ?,
        product_description = ?,
        product_stock = ?,
        product_sold = ?
      WHERE
        product_id = ?
    `

    const [products] = await connection.execute(query_statement, [category_id, product_name, product_price, product_thumbnail, product_description, product_stock, product_sold, product_id])

    return products

  } catch (error) {
    throw new Error(error);
  }
}



const hardDeleteProduct = async (productId) => {
  const connection = await connectDb()
  try {
    const query_statement = `
      DELETE FROM
        products
      WHERE
        product_id = ?
    `

    const deletedProduct = await connection.execute(query_statement, [productId])

    return deletedProduct
    
    
  } catch (error) {
    throw new Error(error)
  }

}


const softDeleteProduct = async (productId) => {
  const connection = await connectDb()
  try {
    const query_statement = `
      UPDATE 
        products
      SET
          is_delete = 1
      WHERE
        product_id = ?
    `

    const deletedProduct = await connection.execute(query_statement, [productId])

    return deletedProduct
    
    
  } catch (error) {
    throw new Error(error)
  }

}


module.exports = { getAllProducts, createProducts, updateProduct, getProductById, hardDeleteProduct, softDeleteProduct }