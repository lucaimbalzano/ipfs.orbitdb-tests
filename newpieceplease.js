class NewPiecePlease {
    constructor(Ipfs, OrbitDB){
        this.Ipfs = Ipfs
        this.OrbitDB = OrbitDB
    }

// Settings Node Ipfs Creation:
// preload: help load balance gloabl network, prevent DDos
// repo: default for browser is './jsipfs'
// EXPEIMENTAL pubsub: is required for OrbitDB usage
// config: peers that are loaded on instantiation
    async create(){
        this.node = await this.Ipfs.create({
            preload: { enabled: false},
            repo: './ipfs',
            EXPERIMENTAL: { pubsub: true},
            config: {
                Bootstrap: [],
                Addresses: { Swarn: []}
            }
        })

        this._init()
    }

// Settings Node OrbitDB Creation:
// accessController = ACL 
// write: access to the database to write ACL by OrbitDB instances identified by id
//pieces.id is divided by 3 parts [example:/orbitdb/zdpuB3VvBJHqYCocN4utQrpBseHou88mq2DLh7bUkWviBQSE3/pieces]:
// 1) /xxx -> is the protocol -> telling this is an orbitdb
// 2) Content ID (CID) of the db manifest, it contains:
        //-  The access control list of the database
        //-  The type of the database
        //-  The name of the database
// 3) final part of the multiadress is the name you provided 'pieces'
    async _init(){
        this.orbitdb = await this.OrbitDB.createInstance(this.node)

        //defaultOptions and docStoreOptions define the parameters 
        this.defaultOptions = {
            accessController: {
                write: [this.orbitdb.identity.id]
            }
        }
        const docStoreOptions = {
            ...this.defaultOptions,
            // which field to index our database
            indexBy: 'hash',
        }
        // creation of the db
        this.pieces = await this.orbitdb.docstore('pieces', docStoreOptions)
        //retrieves all of the values via their content addresses and loads the content into memory
        await this.pieces.load()
        if(this.onready) this.onready();
    }


     async addNewPiece(hash, instrument = 'Piano') {
           const existingPiece = this.getPieceByHash(hash)
           if (existingPiece) {
            return  await this.updatePieceByHash(hash, instrument)
           }
        
           const cid = await this.pieces.put({ hash, instrument })
           return cid
         }

    async updatePieceByHash (hash, instrument = 'Piano') {
           const piece = await this.getPieceByHash(hash)
           piece.instrument = instrument
           const cid = await this.pieces.put(piece)
           return cid
    }

    async deletePieceByHash (hash) {
           const cid = await this.pieces.del(hash)
           return cid
    }


    getAllPieces(){
        const pieces = this.pieces.get('')
        return pieces;
    }

    getPieceByHash(hash){
        console.log('this.getPieceByHash: '+JSON.stringify(this.pieces.get(hash), null, "\t"))
        const singlePiece = this.pieces.get(hash)[0]
        return singlePiece;
    }

    getPieceByInstrument(instrument){
        return instrument =  this.pieces.query((piece) => piece.instrument === instrument)
    }


}





//Initialize constructors and exports module
try {
    const Ipfs = require('ipfs')
    const OrbitDB = require('orbit-db')

    module.exports = exports = new NewPiecePlease(Ipfs, OrbitDB)
} catch (e) {
    window.NPP = new NewPiecePlease(window.Ipfs, window.OrbitDB)
}