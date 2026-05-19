import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export function useCycloPousses(params = {}) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async (overrides = {}) => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/cyclopousse', {
        params: { ...params, ...overrides },
      });
      setData(res.data);
      setTotal(res.total);
      setPages(res.pages);
    } catch {}
    finally { setLoading(false); }
  }, [JSON.stringify(params)]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, total, pages, loading, refetch: fetch };
}

export function useCycloPousse(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/cyclopousse/${id}`)
      .then(({ data: r }) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, loading, setData, refetch };
}

export function useStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/cyclopousse/stats')
      .then(({ data: r }) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return { stats, loading };
}

export function useUsers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const refetch = useCallback(() => {
    setLoading(true);
    api.get('/users')
      .then(({ data: r }) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { refetch(); }, [refetch]);
  return { data, loading, refetch };
}
