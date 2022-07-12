const findOneAndUpdate = async (db, collection, findOptions, searchOptions) => {
    await (await db)
        .collection(collection)
        .findOneAndUpdate(findOptions, searchOptions);
};

export default { findOneAndUpdate };
