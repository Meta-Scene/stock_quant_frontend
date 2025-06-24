import { defineStore } from 'pinia'
import { set, get } from 'idb-keyval'

const BASE = 'http://120.27.208.55:10002'
// const BASE = 'http://172.16.33.65:8080';
const STORAGE_KEY = 'stock_app_user'

export default defineStore('stock', {
  state: () => ({
    user: null,
    stockNumber: 0,
    stockData: [],
    charts: {},
    currentPage: 1,
    selectedDate: '',
    strategyIndex: '0',
    replayIndex: '1',
    analysisIndex: '0',
    stockSearch: '',
    fmark_total: [],
    favorites: [], //自选股
  }),
  actions: {
    async login(account, password) {
      try {
        // const response = await fetch(`http://172.16.33.65:8080/user/login`, {
        const response = await fetch(`${BASE}/user/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ account: account, passWord: password }),
        })

        if (!response.ok) {
          throw new Error('登录失败')
        }

        const data = await response.json()
        console.log('登录接口返回：', data)
        this.user = {
          account: data.data.userInfo.account, // 保存账号
          token: data.data.accessToken, // 保存 token
          // expireIn: data.data.expireIn          // 保存 token 过期时间
        }
        console.log('登录token：', data.data.accessToken)
        // 持久化
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.user))

        return true
      } catch (error) {
        console.error('登录错误:', error)
        return false
      }
    },
    logout() {
      this.user = null
      localStorage.removeItem(STORAGE_KEY) // 清除本地存储的用户信息
    },

    /** 从 localStorage 加载用户信息 **/
    loadUserFromLocal() {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          this.user = JSON.parse(stored)
        } catch {
          this.user = null
        }
      }
    },

    async register(username, account, password) {
      try {
        // const response = await fetch(`http://172.16.33.65:8080/user/register`, {
        const response = await fetch(`${BASE}/user/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userName: username, account: account, passWord: password }),
        })

        if (!response.ok) {
          throw new Error('注册失败')
        }

        const data = await response.json()
        console.log('注册成功:', data)
        return true
      } catch (error) {
        console.error('注册错误:', error)
        return false
      }
    },
    async authorizedFetch(url, options = {}) {
      if (!this.user || !this.user.token) {
        throw new Error('用户未登录或 token 不存在')
      }

      const headers = {
        ...options.headers,
        // 'Authorization': `Bearer ${this.user.token}`, // 添加 token 到请求头
        Authorization: `${this.user.token}`, // 添加 token 到请求头
      }

      const response = await fetch(url, { ...options, headers })

      if (!response.ok) {
        throw new Error(`请求失败: ${response.statusText}`)
      }

      return response.json()
    },

    /** 拉取所有自选股 **/
    async loadCollectsFromServer() {
      const data = await this.authorizedFetch(`${BASE}/collect/all`, { method: 'GET' })
      this.favorites = data
    },

    /** 添加自选股 **/
    async addCollect(code) {
      if (!this.user?.token) {
        throw new Error('用户未登录或 token 不存在')
      }

      const res = await fetch(`${BASE}/collect/${code}`, {
        method: 'POST',
        headers: {
          Authorization: this.user.token,
        },
      })
      const text = await res.text()
      console.log('添加自选股，后端返回:', text)
      if (!res.ok) {
        throw new Error(`添加自选股失败: ${text}`)
      }
      // 更新本地 favorites
      if (!this.favorites.includes(code)) {
        this.favorites = [...this.favorites, code]
      }
    },

    /** 删除自选股 **/
    async removeCollect(code) {
      if (!this.user?.token) {
        throw new Error('用户未登录或 token 不存在')
      }
      // 发起 DELETE 请求，头部带上 token
      const res = await fetch(`${BASE}/collect/${encodeURIComponent(code)}`, {
        method: 'DELETE',
        headers: {
          Authorization: this.user.token,
        },
      })
      const text = await res.text()
      console.log('删除自选股，后端返回:', text)
      if (!res.ok) {
        throw new Error(`删除自选股失败: ${text}`)
      }
      // 更新本地 favorites
      this.favorites = this.favorites.filter((c) => c !== code)
    },
    /** 切换收藏状态 **/
    async toggleFavorite(code) {
      try {
        if (this.favorites.includes(code)) {
          console.log(`Removing ${code} from favorites`)
          await this.removeCollect(code)
        } else {
          console.log(`Adding ${code} to favorites`)
          await this.addCollect(code)
        }
        this.favorites = [...this.favorites]
        console.log('Updated favorites:', this.favorites)
      } catch (err) {
        console.error('Error toggling favorite:', err)
      }
    },
    /** 判断是否已收藏 **/
    isFavorited(code) {
      return this.favorites.includes(code)
    },
    // 保存 fmark_total 到 IndexedDB
    async saveFmarkTotal() {
      await set('fmark_total', this.fmark_total.slice())
    },
    // 从 IndexedDB 读取 fmark_total
    async loadFmarkTotal() {
      const data = await get('fmark_total')
      if (data) {
        this.fmark_total = data
      }
    },

    async init() {
      // 先从本地读取用户信息
      this.loadUserFromLocal()
      // if (this.user && this.user.token) {
      await this.loadCollectsFromServer().catch(console.error)
      // }
      await this.loadFmarkTotal().catch(console.error)
      // await this.loadCollectsFromServer().catch(console.error);
      // await this.loadFmarkTotal();
    },
  },
})
