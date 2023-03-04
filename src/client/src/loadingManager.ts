export class OurLoadingManager {

  loader_:any
  files_:Set<any>
  onLoad:any

  constructor(loader:any) {
    this.loader_ = loader
    this.files_ = new Set()
    this.onLoad = () => {}
  }

  load(file:any, cb:any) {
    this.files_.add(file)

    this.loader_.load(file, (result:any) => {
      this.files_.delete(file)
      cb(result)

      if (this.files_.size == 0) {
        this.onLoad()
      }
    })
  }
}
